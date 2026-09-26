import logging
from .models import ActivityLog

logger = logging.getLogger(__name__)

def log_activity(user, activity_text):
    """
    Safely records an activity in the ActivityLog model for the given user.
    """
    if not user or not user.is_authenticated:
        return None
    try:
        return ActivityLog.objects.create(user=user, activity=activity_text)
    except Exception as exc:
        logger.error(f"Failed to record activity log: {exc}")
        return None
