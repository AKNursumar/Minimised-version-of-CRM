import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import EmailNotification

logger = logging.getLogger(__name__)

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


def create_and_send_notification(followup, receiver, subject=None, message=None):
    """
    Convenience helper to create an EmailNotification record for a FollowUp and immediately dispatch it.
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

    send_notification_email(notification)
    return notification
