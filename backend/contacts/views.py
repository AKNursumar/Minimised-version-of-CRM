import csv
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.permissions import AllCRMUsers
from users.activity import log_activity
from .models import Contact, InteractionNote
from .serializers import ContactSerializer, InteractionNoteSerializer


class ContactViewSet(viewsets.ModelViewSet):

    serializer_class = ContactSerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):
        qs = Contact.objects.all().order_by("-id")

        # Refined Search (name or company)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(company__icontains=search))

        return qs

    def perform_create(self, serializer):
        contact = serializer.save()
        log_activity(self.request.user, f"Created contact {contact.name}")

    def perform_update(self, serializer):
        contact = serializer.save()
        log_activity(self.request.user, f"Updated contact {contact.name}")

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request):
        # Role-based restriction: Only ADMIN and MANAGER can export
        if request.user.role not in ["ADMIN", "MANAGER"]:
            return Response(
                {"detail": "You do not have permission to export data. Only Admins and Managers can export CSV records."},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = self.get_queryset()

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="contacts_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ID",
            "Name",
            "Email",
            "Phone",
            "Company",
            "Address",
            "Notes",
            "Created At",
        ])

        for contact in qs:
            writer.writerow([
                contact.id,
                contact.name,
                contact.email or "",
                contact.phone or "",
                contact.company or "",
                contact.address or "",
                contact.notes or "",
                contact.created_at.strftime("%Y-%m-%d %H:%M:%S") if contact.created_at else "",
            ])

        log_activity(request.user, f"Exported {qs.count()} contacts to CSV")
        return response

    @action(detail=True, methods=["get"], url_path="timeline")
    def timeline(self, request, pk=None):
        """
        Unified Customer Interaction Timeline:
        Combines lead origin, opportunity deals, stage progression,
        follow-up schedules, email notifications, and interaction notes
        into a chronologically ordered, unified customer history.
        """
        from followups.models import FollowUp, EmailNotification

        contact = self.get_object()
        events = []

        # 1. Lead Origin (if contact converted/originated from a lead)
        if contact.lead:
            lead = contact.lead
            events.append({
                "id": f"lead-{lead.id}",
                "type": "LEAD",
                "category": "Lead Inception",
                "title": f"Lead Captured ({lead.get_source_display()})",
                "timestamp": lead.created_at.isoformat(),
                "badge": lead.get_status_display(),
                "badge_color": "blue",
                "description": f"Customer originated as a lead from {lead.get_source_display()}.",
                "details": {
                    "lead_id": lead.id,
                    "lead_name": lead.name,
                    "source": lead.source,
                    "status": lead.status,
                    "email": lead.email,
                    "phone": lead.phone,
                },
                "author": lead.assigned_to.username if lead.assigned_to else "System Ingestion",
            })

        # 2. Contact Profile Established
        events.append({
            "id": f"contact-{contact.id}",
            "type": "CONTACT",
            "category": "Profile Created",
            "title": f"Customer Profile Created",
            "timestamp": contact.created_at.isoformat(),
            "badge": "Active Customer",
            "badge_color": "emerald",
            "description": f"Contact record established for {contact.name}" + (f" at {contact.company}" if contact.company else ""),
            "details": {
                "name": contact.name,
                "company": contact.company,
                "email": contact.email,
                "phone": contact.phone,
                "address": contact.address,
                "initial_notes": contact.notes,
            },
            "author": "CRM Team",
        })

        # 3. Deals / Opportunities & Progression
        for opp in contact.opportunities.all():
            events.append({
                "id": f"opp-{opp.id}",
                "type": "DEAL",
                "category": "Deal Created",
                "title": f"Opportunity: {opp.title}",
                "timestamp": opp.created_at.isoformat(),
                "badge": opp.get_stage_display(),
                "badge_color": "purple",
                "amount": float(opp.amount),
                "description": f"Registered deal in pipeline stage '{opp.get_stage_display()}' valued at ${float(opp.amount):,.2f}.",
                "details": {
                    "opp_id": opp.id,
                    "stage": opp.stage,
                    "amount": str(opp.amount),
                    "expected_close": str(opp.expected_close) if opp.expected_close else None,
                    "notes": opp.notes,
                },
                "author": opp.assigned_to.username if opp.assigned_to else "Unassigned",
            })

            # If updated after creation, add deal update event
            if opp.updated_at and opp.updated_at.strftime("%Y-%m-%d %H:%M") != opp.created_at.strftime("%Y-%m-%d %H:%M"):
                events.append({
                    "id": f"opp-update-{opp.id}",
                    "type": "DEAL",
                    "category": "Pipeline Progression",
                    "title": f"Deal Updated: {opp.title}",
                    "timestamp": opp.updated_at.isoformat(),
                    "badge": opp.get_stage_display(),
                    "badge_color": "indigo",
                    "amount": float(opp.amount),
                    "description": f"Pipeline update: Current stage is '{opp.get_stage_display()}'.",
                    "details": {
                        "opp_id": opp.id,
                        "stage": opp.stage,
                        "amount": str(opp.amount),
                        "notes": opp.notes,
                    },
                    "author": opp.assigned_to.username if opp.assigned_to else "Unassigned",
                })

        # 4. Follow-up Reminders & Meetings
        followups = FollowUp.objects.filter(opportunity__contact=contact).select_related("opportunity")
        for fu in followups:
            badge_color = "amber" if fu.status == "PENDING" else "emerald" if fu.status == "COMPLETED" else "rose"
            time_info = f" at {fu.reminder_time}" if fu.reminder_time else ""
            events.append({
                "id": f"fu-{fu.id}",
                "type": "FOLLOWUP",
                "category": "Scheduled Follow-up",
                "title": f"Follow-up: {fu.opportunity.title}",
                "timestamp": fu.created_at.isoformat(),
                "badge": fu.get_status_display(),
                "badge_color": badge_color,
                "description": f"Scheduled for {fu.followup_date}{time_info}. Remarks: {fu.remarks or 'No specific notes.'}",
                "details": {
                    "followup_id": fu.id,
                    "date": str(fu.followup_date),
                    "time": str(fu.reminder_time) if fu.reminder_time else None,
                    "status": fu.status,
                    "remarks": fu.remarks,
                },
                "author": fu.opportunity.assigned_to.username if fu.opportunity.assigned_to else "System",
            })

        # 5. Email Communications & Notifications
        email_filter = Q(followup__opportunity__contact=contact)
        if contact.email:
            email_filter |= Q(receiver=contact.email)
        emails = EmailNotification.objects.filter(email_filter).distinct().select_related("followup")

        for email in emails:
            badge_color = "emerald" if email.status == "SENT" else "amber" if email.status == "PENDING" else "rose"
            events.append({
                "id": f"email-{email.id}",
                "type": "EMAIL",
                "category": "Email Communication",
                "title": f"Email: {email.subject}",
                "timestamp": (email.sent_at or email.created_at).isoformat(),
                "badge": email.get_status_display(),
                "badge_color": badge_color,
                "description": email.message,
                "details": {
                    "email_id": email.id,
                    "receiver": email.receiver,
                    "subject": email.subject,
                    "status": email.status,
                    "sent_at": email.sent_at.isoformat() if email.sent_at else None,
                    "followup_id": email.followup_id,
                },
                "author": "System Mailer (Celery Queue)",
            })

        # 6. Customer Interaction Notes
        for note in contact.interaction_notes.all().select_related("user"):
            note_colors = {
                InteractionNote.NoteType.NOTE: "gray",
                InteractionNote.NoteType.CALL: "blue",
                InteractionNote.NoteType.MEETING: "purple",
                InteractionNote.NoteType.EMAIL: "sky",
                InteractionNote.NoteType.FOLLOWUP: "amber",
            }
            events.append({
                "id": f"note-{note.id}",
                "type": "NOTE",
                "category": note.get_note_type_display(),
                "title": note.title or f"{note.get_note_type_display()} Log",
                "timestamp": note.created_at.isoformat(),
                "badge": note.get_note_type_display(),
                "badge_color": note_colors.get(note.note_type, "gray"),
                "description": note.content,
                "details": {
                    "note_id": note.id,
                    "note_type": note.note_type,
                    "title": note.title,
                },
                "author": note.user.username if note.user else "Team Member",
            })

        # Order chronological (default: newest first)
        order = request.query_params.get("order", "desc").lower()
        events.sort(key=lambda x: x["timestamp"], reverse=(order == "desc"))

        # Summary Metrics
        summary = {
            "total_events": len(events),
            "deals_count": contact.opportunities.count(),
            "emails_count": emails.count(),
            "followups_count": followups.count(),
            "notes_count": contact.interaction_notes.count(),
            "has_lead_origin": bool(contact.lead),
        }

        return Response({
            "contact": ContactSerializer(contact).data,
            "summary": summary,
            "events": events,
        })

    @action(detail=True, methods=["post"], url_path="notes")
    def add_note(self, request, pk=None):
        """
        Logs a new interaction note (Call, Meeting, Note, Follow-up, Email)
        for this customer.
        """
        contact = self.get_object()
        serializer = InteractionNoteSerializer(data=request.data)
        if serializer.is_valid():
            note = serializer.save(contact=contact, user=request.user)
            log_activity(request.user, f"Logged {note.get_note_type_display()} for {contact.name}")
            return Response(InteractionNoteSerializer(note).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)