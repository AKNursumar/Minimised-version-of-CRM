from rest_framework import viewsets
from users.permissions import AllCRMUsers
from .models import Lead
from .serializers import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):

    serializer_class = LeadSerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):

        user = self.request.user

        if user.role == "ADMIN":
            return Lead.objects.all()

        if user.role == "MANAGER":
            return Lead.objects.all()

        return Lead.objects.filter(
            assigned_to=user
        )

    def perform_create(self, serializer):
        lead = serializer.save()
        from users.activity import log_activity
        log_activity(self.request.user, f"Created lead {lead.name}")

    def perform_update(self, serializer):
        lead = serializer.save()
        from users.activity import log_activity
        log_activity(self.request.user, f"Updated lead {lead.name}")