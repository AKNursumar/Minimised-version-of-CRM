from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.permissions import AllCRMUsers
from .models import FollowUp, EmailNotification
from .serializers import (
    FollowUpSerializer,
    EmailNotificationSerializer
)
from .services import send_notification_email, create_and_send_notification


class FollowUpViewSet(viewsets.ModelViewSet):

    queryset = FollowUp.objects.all().order_by("-id")
    serializer_class = FollowUpSerializer
    permission_classes = [AllCRMUsers]

    def perform_create(self, serializer):
        followup = serializer.save()

        # Check if email reminder was configured
        email_reminder = self.request.data.get("email_reminder")
        receiver = self.request.data.get("receiver")
        subject = self.request.data.get("subject")
        message = self.request.data.get("message")

        if (email_reminder is True or str(email_reminder).lower() in ("true", "1")) and receiver:
            create_and_send_notification(
                followup=followup,
                receiver=receiver,
                subject=subject,
                message=message,
            )

        from users.activity import log_activity
        opp_title = followup.opportunity.title if followup.opportunity else f"#{followup.id}"
        log_activity(self.request.user, f"Created follow-up for {opp_title}")

    def perform_update(self, serializer):
        prev_status = self.get_object().status
        followup = serializer.save()
        from users.activity import log_activity
        opp_title = followup.opportunity.title if followup.opportunity else f"#{followup.id}"
        if prev_status != followup.status and followup.status == FollowUp.Status.COMPLETED:
            log_activity(self.request.user, f"Completed follow-up for {opp_title}")
        else:
            log_activity(self.request.user, f"Updated follow-up for {opp_title}")


class EmailNotificationViewSet(viewsets.ModelViewSet):

    queryset = EmailNotification.objects.all().order_by("-id")
    serializer_class = EmailNotificationSerializer
    permission_classes = [AllCRMUsers]

    def perform_create(self, serializer):
        notification = serializer.save()
        if notification.status == EmailNotification.Status.PENDING:
            send_notification_email(notification)
        from users.activity import log_activity
        log_activity(self.request.user, f"Sent email notification to {notification.receiver}")

    @action(detail=True, methods=["post"])
    def resend(self, request, pk=None):
        notification = self.get_object()
        success, message = send_notification_email(notification)
        from users.activity import log_activity
        log_activity(request.user, f"Re-sent email notification to {notification.receiver}")
        return Response({
            "success": success,
            "message": message,
            "notification": self.get_serializer(notification).data,
        })