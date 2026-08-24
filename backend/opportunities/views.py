from rest_framework import viewsets

from .models import Opportunity
from .serializers import OpportunitySerializer
from users.permissions import AllCRMUsers


class OpportunityViewSet(viewsets.ModelViewSet):

    serializer_class = OpportunitySerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Opportunity.objects.all()

        if user.role == "MANAGER":
            return Opportunity.objects.all()

        return Opportunity.objects.filter(
            assigned_to=user
        )

    def perform_create(self, serializer):

        user = self.request.user

        if user.role == "SALES_EXECUTIVE":
            serializer.save(
                assigned_to=user
            )
        else:
            serializer.save()