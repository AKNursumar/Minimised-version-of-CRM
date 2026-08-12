from rest_framework import viewsets

from .models import FollowUp, EmailNotification
from .serializers import (
    FollowUpSerializer,
    EmailNotificationSerializer
)


class FollowUpViewSet(viewsets.ModelViewSet):

    queryset = FollowUp.objects.all()
    serializer_class = FollowUpSerializer


class EmailNotificationViewSet(viewsets.ModelViewSet):

    queryset = EmailNotification.objects.all()
    serializer_class = EmailNotificationSerializer