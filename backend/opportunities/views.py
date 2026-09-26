from rest_framework import viewsets

from .models import Opportunity
from .serializers import OpportunitySerializer
from users.permissions import AllCRMUsers
from users.activity import log_activity


class OpportunityViewSet(viewsets.ModelViewSet):

    queryset = Opportunity.objects.all().order_by("-id")
    serializer_class = OpportunitySerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Opportunity.objects.all().order_by("-id")

        if user.role == "MANAGER":
            return Opportunity.objects.all().order_by("-id")

        return Opportunity.objects.filter(
            assigned_to=user
        ).order_by("-id")

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == "SALES_EXECUTIVE":
            opp = serializer.save(
                assigned_to=user
            )
        else:
            opp = serializer.save()

        log_activity(user, f"Created opportunity {opp.title}")

    def perform_update(self, serializer):
        opp = serializer.save()
        log_activity(self.request.user, f"Updated opportunity {opp.title} ({opp.stage})")