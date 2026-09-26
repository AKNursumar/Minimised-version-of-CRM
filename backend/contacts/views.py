from rest_framework import viewsets
from users.permissions import AllCRMUsers
from users.activity import log_activity
from .models import Contact
from .serializers import ContactSerializer


class ContactViewSet(viewsets.ModelViewSet):

    queryset = Contact.objects.all().order_by("-id")
    serializer_class = ContactSerializer
    permission_classes = [AllCRMUsers]

    def perform_create(self, serializer):
        contact = serializer.save()
        log_activity(self.request.user, f"Created contact {contact.name}")

    def perform_update(self, serializer):
        contact = serializer.save()
        log_activity(self.request.user, f"Updated contact {contact.name}")