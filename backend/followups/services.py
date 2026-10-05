import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailNotification

logger = logging.getLogger(__name__)


def is_celery_broker_reachable() -> bool:
    """
    Lightweight health check for the Celery Redis message broker.
    Returns True immediately if eager mode is active or Redis responds to ping.
    """
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        return True
    broker_url = getattr(settings, "CELERY_BROKER_URL", "redis://localhost:6379/0")
    try:
        import redis
        r = redis.Redis.from_url(broker_url, socket_connect_timeout=0.3, socket_timeout=0.3)
        r.ping()
        return True
    except Exception:
        return False


def send_notification_email(notification: EmailNotification):
    """
    Sends an email for a given EmailNotification object and updates its status.
    """
    try:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@minimisedcrm.local")
        
        logger.info(
            f"Sending email notification #{notification.id} to {notification.receiver} with subject '{notification.subject}'"
        )
        
        send_mail(
            subject=notification.subject,
            message=notification.message,
            from_email=from_email,
            recipient_list=[notification.receiver],
            fail_silently=False,
        )

        notification.status = EmailNotification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save(update_fields=["status", "sent_at"])
        return True, "Email sent successfully"

    except Exception as exc:
        logger.error(f"Failed to send email notification #{notification.id}: {exc}")
        notification.status = EmailNotification.Status.FAILED
        notification.save(update_fields=["status"])
        return False, str(exc)


def dispatch_notification_email(notification: EmailNotification, use_async: bool = True):
    """
    Dispatches an email notification.
    If use_async is True and Celery broker is reachable (or eager mode),
    enqueues the task in Celery Redis queue.
    If Redis or Celery broker is unreachable, gracefully falls back to direct delivery.
    """
    if use_async and is_celery_broker_reachable():
        try:
            from .tasks import send_email_notification_task
            async_result = send_email_notification_task.delay(notification.id)
            logger.info(f"Notification #{notification.id} dispatched via Celery task {async_result.id}")
            return True, f"Queued via Celery task (Task ID: {async_result.id})"
        except Exception as exc:
            logger.warning(
                f"Celery queueing failed ({exc}). Falling back to direct synchronous dispatch."
            )
            return send_notification_email(notification)
    else:
        return send_notification_email(notification)


def create_and_send_notification(followup, receiver, subject=None, message=None, use_async=True):
    """
    Convenience helper to create an EmailNotification record for a FollowUp and dispatch it.
    """
    opp_title = followup.opportunity.title if followup.opportunity else "CRM Opportunity"
    
    if not subject:
        subject = f"Follow-up Reminder: {opp_title}"

    if not message:
        time_str = f" at {followup.reminder_time}" if followup.reminder_time else ""
        remarks_str = f"\nRemarks: {followup.remarks}" if followup.remarks else ""
        message = (
            f"Dear Customer / Team Member,\n\n"
            f"This is a scheduled CRM reminder regarding your opportunity: '{opp_title}'.\n"
            f"Scheduled Date: {followup.followup_date}{time_str}\n"
            f"Current Status: {followup.status}"
            f"{remarks_str}\n\n"
            f"Please let us know if you need to reschedule or require further information.\n\n"
            f"Best regards,\n"
            f"Minimised CRM System"
        )

    notification = EmailNotification.objects.create(
        followup=followup,
        receiver=receiver,
        subject=subject,
        message=message,
        status=EmailNotification.Status.PENDING,
    )

    dispatch_notification_email(notification, use_async=use_async)
    return notification
