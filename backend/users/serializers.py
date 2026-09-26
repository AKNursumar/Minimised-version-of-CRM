from rest_framework import serializers
from .models import User, ActivityLog


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

class CurrentUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    user_details = CurrentUserSerializer(source="user", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "user",
            "username",
            "user_details",
            "activity",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]