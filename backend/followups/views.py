from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.permissions import AllCRMUsers
from .models import FollowUp, EmailNotification
from .serializers import (
    FollowUpSerializer,
    EmailNotificationSerializer
)
from .services import (
    send_notification_email,
    dispatch_notification_email,
    create_and_send_notification
)


class FollowUpViewSet(viewsets.ModelViewSet):

    serializer_class = FollowUpSerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return FollowUp.objects.none()
        if getattr(user, "role", None) in ["ADMIN", "MANAGER"]:
            qs = FollowUp.objects.all().order_by("-id")
        else:
            qs = FollowUp.objects.filter(opportunity__assigned_to=user).order_by("-id")

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        date_param = self.request.query_params.get("date")
        if date_param:
            qs = qs.filter(followup_date=date_param)

        return qs

    def perform_create(self, serializer):
        followup = serializer.save()

        # Check if email reminder was configured
        req_data = self.request.data if isinstance(self.request.data, dict) else {}
        email_reminder = req_data.get("email_reminder")
        receiver = req_data.get("receiver")
        subject = req_data.get("subject")
        message = req_data.get("message")

        if (email_reminder is True or str(email_reminder).lower() in ("true", "1")) and receiver:
            create_and_send_notification(
                followup=followup,
                receiver=receiver,
                subject=subject,
                message=message,
                use_async=True,
            )

        from users.activity import log_activity
        opp_title = followup.opportunity.title if followup.opportunity else f"#{followup.pk}"
        log_activity(self.request.user, f"Created follow-up for {opp_title}")

    def perform_update(self, serializer):
        prev_status = self.get_object().status
        followup = serializer.save()
        from users.activity import log_activity
        opp_title = followup.opportunity.title if followup.opportunity else f"#{followup.pk}"
        if prev_status != followup.status and followup.status == FollowUp.Status.COMPLETED:
            log_activity(self.request.user, f"Completed follow-up for {opp_title}")
        else:
            log_activity(self.request.user, f"Updated follow-up for {opp_title}")

    @action(detail=False, methods=["post"], url_path="trigger-reminders")
    def trigger_reminders(self, request):
        """
        Manually triggers the background scheduled reminder scan.
        Executes asynchronously via Celery or falls back to direct execution.
        """
        from .services import is_celery_broker_reachable
        from .tasks import process_scheduled_reminders_task
        if is_celery_broker_reachable():
            try:
                async_task = process_scheduled_reminders_task.delay()
                return Response({
                    "success": True,
                    "mode": "async",
                    "task_id": async_task.id,
                    "message": "Scheduled reminder task dispatched to Celery worker queue.",
                })
            except Exception:
                pass

        result = process_scheduled_reminders_task()
        return Response({
            "success": True,
            "mode": "sync",
            "result": result,
            "message": "Scheduled reminder task executed directly (Celery worker offline).",
        })


class EmailNotificationViewSet(viewsets.ModelViewSet):

    serializer_class = EmailNotificationSerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return EmailNotification.objects.none()
        if getattr(user, "role", None) in ["ADMIN", "MANAGER"]:
            return EmailNotification.objects.all().order_by("-id")
        return EmailNotification.objects.filter(
            followup__opportunity__assigned_to=user
        ).order_by("-id")

    def perform_create(self, serializer):
        notification = serializer.save()
        if notification.status == EmailNotification.Status.PENDING:
            dispatch_notification_email(notification, use_async=True)
        from users.activity import log_activity
        log_activity(self.request.user, f"Dispatched email notification to {notification.receiver}")

    @action(detail=True, methods=["post"])
    def resend(self, request, pk=None):
        notification = self.get_object()

        # Guard against duplicate queueing if already in queue
        if notification.status == EmailNotification.Status.QUEUED:
            return Response(
                {
                    "success": False,
                    "message": "Email notification is already queued for delivery.",
                    "notification": self.get_serializer(notification).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Reset status if previously sent or failed
        if notification.status in [EmailNotification.Status.FAILED, EmailNotification.Status.SENT]:
            notification.status = EmailNotification.Status.PENDING
            notification.sent_at = None
            notification.save(update_fields=["status", "sent_at"])

        success, message = dispatch_notification_email(notification, use_async=True)
        notification.refresh_from_db()

        if success:
            from users.activity import log_activity
            log_activity(request.user, f"Re-sent email notification to {notification.receiver}")
            http_status = (
                status.HTTP_202_ACCEPTED
                if notification.status == EmailNotification.Status.QUEUED
                else status.HTTP_200_OK
            )
            return Response(
                {
                    "success": True,
                    "message": message,
                    "notification": self.get_serializer(notification).data,
                },
                status=http_status,
            )
        else:
            return Response(
                {
                    "success": False,
                    "message": message,
                    "notification": self.get_serializer(notification).data,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    @action(detail=False, methods=["get"], url_path="queue-status")
    def queue_status(self, request):
        """
        Checks Celery and Redis task queue operational status.
        """
        from django.conf import settings
        from config.celery import app as celery_app

        broker_url = getattr(settings, "CELERY_BROKER_URL", "redis://localhost:6379/0")
        broker_reachable = False
        active_workers = []

        try:
            import redis
            r = redis.Redis.from_url(broker_url, socket_connect_timeout=0.5, socket_timeout=0.5)
            r.ping()
            broker_reachable = True
        except Exception:
            broker_reachable = False

        if broker_reachable:
            try:
                inspect = celery_app.control.inspect(timeout=0.3)
                ping = inspect.ping() if inspect else None
                if ping:
                    active_workers = list(ping.keys())
            except Exception:
                pass

        return Response({
            "broker": "Redis",
            "broker_url": broker_url.split("@")[-1] if "@" in broker_url else broker_url,
            "broker_reachable": broker_reachable,
            "celery_workers": active_workers,
            "eager_mode": getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False),
            "pending_emails": EmailNotification.objects.filter(status=EmailNotification.Status.PENDING).count(),
            "queued_emails": EmailNotification.objects.filter(status=EmailNotification.Status.QUEUED).count(),
            "sent_emails": EmailNotification.objects.filter(status=EmailNotification.Status.SENT).count(),
            "failed_emails": EmailNotification.objects.filter(status=EmailNotification.Status.FAILED).count(),
        })