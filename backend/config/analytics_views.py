from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import AllCRMUsers
from leads.models import Lead
from contacts.models import Contact
from opportunities.models import Opportunity
from followups.models import FollowUp, EmailNotification


class AnalyticsSummaryView(APIView):
    permission_classes = [AllCRMUsers]

    def get(self, request):
        user = request.user

        # Scope queries based on user role
        if user.role in ["ADMIN", "MANAGER"]:
            leads_qs = Lead.objects.all()
            opps_qs = Opportunity.objects.all()
            followups_qs = FollowUp.objects.all()
        else:
            leads_qs = Lead.objects.filter(assigned_to=user)
            opps_qs = Opportunity.objects.filter(assigned_to=user)
            followups_qs = FollowUp.objects.filter(opportunity__in=opps_qs)

        contacts_qs = Contact.objects.all()

        # 1. Lead Status Breakdown
        lead_status_counts = {choice[0]: 0 for choice in Lead.Status.choices}
        for item in leads_qs.values("status").annotate(count=Count("id")):
            lead_status_counts[item["status"]] = item["count"]

        # 2. Lead Source Breakdown
        lead_source_counts = {choice[0]: 0 for choice in Lead.Source.choices}
        for item in leads_qs.values("source").annotate(count=Count("id")):
            lead_source_counts[item["source"]] = item["count"]

        # 3. Opportunity Stage Counts and Stage Values
        opp_stage_counts = {choice[0]: 0 for choice in Opportunity.Stage.choices}
        opp_stage_values = {choice[0]: 0.0 for choice in Opportunity.Stage.choices}
        for item in opps_qs.values("stage").annotate(count=Count("id"), total_value=Sum("amount")):
            opp_stage_counts[item["stage"]] = item["count"]
            opp_stage_values[item["stage"]] = float(item["total_value"] or 0.0)

        # 4. Follow-up Status Counts
        followup_status_counts = {choice[0]: 0 for choice in FollowUp.Status.choices}
        for item in followups_qs.values("status").annotate(count=Count("id")):
            followup_status_counts[item["status"]] = item["count"]

        total_opp_value = float(opps_qs.aggregate(total=Sum("amount"))["total"] or 0.0)
        won_opp_value = float(opps_qs.filter(stage="WON").aggregate(total=Sum("amount"))["total"] or 0.0)

        # 5. Email Notifications Summary
        email_sent = EmailNotification.objects.filter(status="SENT").count()
        email_failed = EmailNotification.objects.filter(status="FAILED").count()
        email_pending = EmailNotification.objects.filter(status="PENDING").count()

        return Response({
            # Top-level flat KPIs for direct consumption
            "total_leads": leads_qs.count(),
            "converted_leads": lead_status_counts.get("CONVERTED", 0),
            "total_contacts": contacts_qs.count(),
            "total_opportunities": opps_qs.count(),
            "won_opportunities": opp_stage_counts.get("WON", 0),
            "lost_opportunities": opp_stage_counts.get("LOST", 0),
            "total_opportunity_value": total_opp_value,
            "won_opportunity_value": won_opp_value,
            "pending_followups": followup_status_counts.get("PENDING", 0),
            "completed_followups": followup_status_counts.get("COMPLETED", 0),
            "sent_emails": email_sent,
            "lead_status_distribution": lead_status_counts,
            "lead_source_distribution": lead_source_counts,
            "opportunity_stage_distribution": opp_stage_counts,
            "revenue_by_stage": opp_stage_values,
            "followup_status_distribution": followup_status_counts,

            # Structured breakdown objects
            "leads": {
                "total": leads_qs.count(),
                "converted": lead_status_counts.get("CONVERTED", 0),
                "by_status": lead_status_counts,
                "by_source": lead_source_counts,
            },
            "contacts": {
                "total": contacts_qs.count(),
            },
            "opportunities": {
                "total": opps_qs.count(),
                "won": opp_stage_counts.get("WON", 0),
                "lost": opp_stage_counts.get("LOST", 0),
                "open": sum(opp_stage_counts[s] for s in ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION"]),
                "total_value": total_opp_value,
                "won_value": won_opp_value,
                "by_stage": opp_stage_counts,
                "value_by_stage": opp_stage_values,
            },
            "followups": {
                "total": followups_qs.count(),
                "pending": followup_status_counts.get("PENDING", 0),
                "completed": followup_status_counts.get("COMPLETED", 0),
                "cancelled": followup_status_counts.get("CANCELLED", 0),
                "by_status": followup_status_counts,
            },
            "email_notifications": {
                "total": EmailNotification.objects.count(),
                "sent": email_sent,
                "failed": email_failed,
                "pending": email_pending,
            },
        })
