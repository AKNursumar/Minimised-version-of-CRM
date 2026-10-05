from rest_framework import serializers
from .models import Contact, InteractionNote


class InteractionNoteSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = InteractionNote
        fields = [
            "id",
            "contact",
            "user",
            "user_name",
            "note_type",
            "title",
            "content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "contact",
            "user",
            "user_name",
            "created_at",
            "updated_at",
        ]


class ContactSerializer(serializers.ModelSerializer):
    notes_count = serializers.IntegerField(source="interaction_notes.count", read_only=True)

    class Meta:
        model = Contact
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "company",
            "address",
            "notes",
            "lead",
            "notes_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "notes_count",
            "created_at",
            "updated_at",
        ]