from rest_framework import serializers
from .models import FollowUp, EmailNotification


class FollowUpSerializer(serializers.ModelSerializer):

    class Meta:
        model = FollowUp
        fields = [
            "id",
            "opportunity",
            "followup_date",
            "reminder_time",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class EmailNotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = EmailNotification
        fields = [
            "id",
            "followup",
            "receiver",
            "subject",
            "message",
            "sent_at",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "sent_at",
            "created_at",
        ]