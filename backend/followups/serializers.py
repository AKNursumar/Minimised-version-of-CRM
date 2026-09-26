from rest_framework import serializers
from .models import FollowUp, EmailNotification


class FollowUpSerializer(serializers.ModelSerializer):
    email_notifications = EmailNotificationSerializer(many=True, read_only=True)
    has_email_reminder = serializers.SerializerMethodField()

    def get_has_email_reminder(self, obj):
        return obj.email_notifications.exists()

    class Meta:
        model = FollowUp
        fields = [
            "id",
            "opportunity",
            "followup_date",
            "reminder_time",
            "status",
            "remarks",
            "email_notifications",
            "has_email_reminder",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email_notifications",
            "has_email_reminder",
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