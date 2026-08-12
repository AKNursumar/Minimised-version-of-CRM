from rest_framework import serializers
from .models import Lead


class LeadSerializer(serializers.ModelSerializer):

    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "company",
            "email",
            "phone",
            "source",
            "status",
            "assigned_to",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]