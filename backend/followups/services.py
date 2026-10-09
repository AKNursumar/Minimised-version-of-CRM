import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailNotification

logger = logging.getLogger(__name__)


def is_celery_broker_reachable() -> bool:
    """
    Lightweight health check for the Celery Redis message broker.
    Returns True immediately if eager mode is active or Redis responds to ping within 0.5s.
    """
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        return True
    broker_url = getattr(settings, "CELERY_BROKER_URL", "redis://localhost:6379/0")
    try:
        import redis
        r = redis.Redis.from_url(broker_url, socket_connect_timeout=0.5, socket_timeout=0.5)
        r.ping()
        return True
    except Exception:
        return False


def send_notification_email(
    notification: EmailNotification,
    mark_failed: bool = True,
) -> tuple[bool, str]:
    """
    Sends an email for a given EmailNotification object and updates its status.
    - Prevents duplicate sends if already marked SENT.
    - Uses finite SMTP timeout configured in Django settings.
    - Ensures a post-delivery DB error does not overwrite SENT with FAILED.
    - Only marks FAILED in the DB if mark_failed is True (allows task retry without premature FAILED state).
    """
    # Guard against duplicate email delivery
    if notification.status == EmailNotification.Status.SENT:
        logger.info(
            f"Notification #{notification.pk} to {notification.receiver} was already sent. Skipping duplicate delivery."
        )
        return True, "Email already sent"

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@minimisedcrm.local")

    logger.info(
        f"Sending email notification #{notification.pk} to {notification.receiver} with subject '{notification.subject}'"
    )

    try:
        send_mail(
            subject=notification.subject,
            message=notification.message,
            from_email=from_email,
            recipient_list=[notification.receiver],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error(
            f"Failed to deliver email notification #{notification.pk} to {notification.receiver}: {exc}"
        )
        if mark_failed:
            try:
                notification.status = EmailNotification.Status.FAILED
                notification.save(update_fields=["status"])
            except Exception as db_err:
                logger.error(
                    f"Failed to update status to FAILED for notification #{notification.pk}: {db_err}"
                )
        return False, str(exc)

    # Email delivered successfully; persist status without risking overwrite to FAILED
    try:
        notification.status = EmailNotification.Status.SENT
        notification.sent_at = timezone.now()
        notification.save(update_fields=["status", "sent_at"])
    except Exception as db_err:
        logger.warning(
            f"Email notification #{notification.pk} was sent successfully, but updating record status encountered an issue: {db_err}"
        )

    return True, "Email sent successfully"


def dispatch_notification_email(
    notification: EmailNotification,
    use_async: bool = True,
) -> tuple[bool, str]:
    """
    Dispatches an email notification.
    - In eager mode (CELERY_TASK_ALWAYS_EAGER=True), executes directly/eagerly.
    - In production with use_async=True, submits to Celery Redis task queue.
      If broker queueing fails, immediately records failure and returns error
      WITHOUT falling back to slow synchronous SMTP inside the HTTP request.
    - If use_async=False, executes synchronous direct delivery.
    """
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        if use_async:
            from .tasks import send_email_notification_task
            async_result = send_email_notification_task.delay(notification.pk)
            notification.refresh_from_db()
            task_id = getattr(async_result, "id", "eager")
            return True, f"Queued via Celery task (Task ID: {task_id})"
        return send_notification_email(notification)

    if use_async:
        try:
            from .tasks import send_email_notification_task
            async_result = send_email_notification_task.delay(notification.pk)
            # Only update status to QUEUED after the broker has accepted the task
            notification.status = EmailNotification.Status.QUEUED
            notification.save(update_fields=["status"])
            logger.info(f"Notification #{notification.pk} queued via Celery task {async_result.id}")
            return True, f"Queued via Celery task (Task ID: {async_result.id})"
        except Exception as exc:
            logger.error(
                f"Celery queueing failed for notification #{notification.pk}: {exc}. "
                f"Refusing synchronous fallback to prevent HTTP request timeout."
            )
            notification.status = EmailNotification.Status.FAILED
            notification.save(update_fields=["status"])
            return False, f"Task queue broker unavailable: {exc}"
    else:
        # Deliberate synchronous delivery requested
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
