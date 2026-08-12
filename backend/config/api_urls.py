from rest_framework.routers import DefaultRouter

from users.views import UserViewSet
from leads.views import LeadViewSet
from contacts.views import ContactViewSet
from opportunities.views import OpportunityViewSet
from followups.views import (
    FollowUpViewSet,
    EmailNotificationViewSet
)


router = DefaultRouter()

router.register("users", UserViewSet, basename="users")
router.register("leads", LeadViewSet, basename="leads")
router.register("contacts", ContactViewSet, basename="contacts")
router.register(
    "opportunities",
    OpportunityViewSet,
    basename="opportunities"
)
router.register(
    "followups",
    FollowUpViewSet,
    basename="followups"
)
router.register(
    "email-notifications",
    EmailNotificationViewSet,
    basename="email-notifications"
)


urlpatterns = router.urls