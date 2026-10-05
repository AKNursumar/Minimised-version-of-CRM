from django.conf import settings
from django.db import models
from leads.models import Lead


class Contact(models.Model):

    name = models.CharField(max_length=150)

    email = models.EmailField(
        blank=True
    )

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    company = models.CharField(
        max_length=150,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contacts"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name


class InteractionNote(models.Model):
    """
    Represents customer touchpoints, interaction logs, call summaries,
    meeting outcomes, and follow-up notes in the Customer Interaction Timeline.
    """

    class NoteType(models.TextChoices):
        NOTE = "NOTE", "General Note"
        CALL = "CALL", "Phone Call"
        MEETING = "MEETING", "Meeting"
        EMAIL = "EMAIL", "Email Interaction"
        FOLLOWUP = "FOLLOWUP", "Follow-up Note"

    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name="interaction_notes"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="authored_interaction_notes"
    )

    note_type = models.CharField(
        max_length=20,
        choices=NoteType.choices,
        default=NoteType.NOTE
    )

    title = models.CharField(
        max_length=255,
        blank=True
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.contact.name} - {self.get_note_type_display()} ({self.created_at.strftime('%Y-%m-%d')})"