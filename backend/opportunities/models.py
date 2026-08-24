from django.conf import settings
from django.db import models
from contacts.models import Contact


class Opportunity(models.Model):

    class Stage(models.TextChoices):
        NEW = "NEW", "New"
        QUALIFIED = "QUALIFIED", "Qualified"
        PROPOSAL = "PROPOSAL", "Proposal"
        NEGOTIATION = "NEGOTIATION", "Negotiation"
        WON = "WON", "Won"
        LOST = "LOST", "Lost"

    title = models.CharField(
        max_length=200
    )

    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name="opportunities"
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_opportunities"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    stage = models.CharField(
        max_length=20,
        choices=Stage.choices,
        default=Stage.NEW
    )

    expected_close = models.DateField(
        null=True,
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title