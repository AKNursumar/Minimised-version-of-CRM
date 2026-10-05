import logging
from celery import shared_task
from django.utils import timezone
from .models import FollowUp, EmailNotification

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_notification_task(self, notification_id):
    """
    Celery background task for asynchronous email delivery with automatic retries.
    """
    from .services import send_notification_email

    try:
        notification = EmailNotification.objects.get(id=notification_id)
    except EmailNotification.DoesNotExist:
        logger.warning(f"EmailNotification #{notification_id} not found. Skipping delivery.")
        return {"status": "NOT_FOUND", "notification_id": notification_id}

    logger.info(f"[Celery] Processing async email delivery for notification #{notification_id} to {notification.receiver}")
    success, message = send_notification_email(notification)

    if not success and self.request.retries < self.max_retries:
        logger.warning(
            f"[Celery] Delivery failed for notification #{notification_id}. "
            f"Retrying ({self.request.retries + 1}/{self.max_retries})... Error: {message}"
        )
        raise self.retry(exc=Exception(message))

    return {
        "status": "SENT" if success else "FAILED",
        "notification_id": notification_id,
        "message": message,
    }


@shared_task(bind=True)
def process_scheduled_reminders_task(self):
    """
    Celery beat periodic task: Scans pending follow-ups due on or before today
    and automatically dispatches email reminders to assigned contacts/leads.
    """
    from .services import create_and_send_notification

    now = timezone.now()
    today = timezone.localdate()
    current_time = now.time()

    logger.info(f"[Celery Beat] Running scheduled reminder check for date: {today}")

    # Query pending followups due today or overdue
    pending_followups = FollowUp.objects.filter(
        status=FollowUp.Status.PENDING,
        followup_date__lte=today,
    ).select_related("opportunity", "opportunity__contact")

    processed = 0
    dispatched = 0

    for followup in pending_followups:
        processed += 1

        # If scheduled for today with a specific reminder_time in future today, skip until that time
        if followup.followup_date == today and followup.reminder_time:
            if followup.reminder_time > current_time:
                continue

        # Check if an email notification was already generated
        already_notified = followup.email_notifications.filter(
            status__in=[EmailNotification.Status.SENT, EmailNotification.Status.PENDING]
        ).exists()

        if not already_notified:
            # Resolve receiver email: contact email or opportunity's assigned user email
            receiver = None
            if followup.opportunity and followup.opportunity.contact and followup.opportunity.contact.email:
                receiver = followup.opportunity.contact.email
            elif followup.opportunity and followup.opportunity.assigned_to and followup.opportunity.assigned_to.email:
                receiver = followup.opportunity.assigned_to.email

            if receiver:
                opp_title = followup.opportunity.title if followup.opportunity else "Scheduled Deal"
                subject = f"Scheduled CRM Reminder: {opp_title}"
                message = (
                    f"Reminder Alert:\n\n"
                    f"You have a pending CRM follow-up scheduled for '{opp_title}'.\n"
                    f"Scheduled Date: {followup.followup_date}\n"
                    f"Remarks: {followup.remarks or 'No specific notes'}\n\n"
                    f"Please log in to the CRM dashboard to update status.\n"
                    f"- Minimised CRM System"
                )
                create_and_send_notification(
                    followup=followup,
                    receiver=receiver,
                    subject=subject,
                    message=message,
                    use_async=True,
                )
                dispatched += 1
                logger.info(f"[Celery Beat] Dispatched reminder for FollowUp #{followup.id} to {receiver}")

    return {
        "status": "COMPLETED",
        "processed_followups": processed,
        "dispatched_reminders": dispatched,
        "checked_at": str(now),
    }
