import csv
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.permissions import AllCRMUsers, AdminManager
from users.activity import log_activity
from .models import Lead
from .serializers import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):

    serializer_class = LeadSerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["ADMIN", "MANAGER"]:
            qs = Lead.objects.all().order_by("-id")
        else:
            qs = Lead.objects.filter(assigned_to=user).order_by("-id")

        # Refined Search (name or company)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(company__icontains=search))

        # Refined Filters (status and source)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        source_param = self.request.query_params.get("source")
        if source_param:
            qs = qs.filter(source=source_param)

        return qs

    def perform_create(self, serializer):
        lead = serializer.save()
        log_activity(self.request.user, f"Created lead {lead.name}")

    def perform_update(self, serializer):
        lead = serializer.save()
        log_activity(self.request.user, f"Updated lead {lead.name}")

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
        response["Content-Disposition"] = 'attachment; filename="leads_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ID",
            "Name",
            "Company",
            "Email",
            "Phone",
            "Source",
            "Status",
            "Assigned To",
            "Created At",
        ])

        for lead in qs:
            writer.writerow([
                lead.id,
                lead.name,
                lead.company or "",
                lead.email or "",
                lead.phone or "",
                lead.source,
                lead.status,
                lead.assigned_to.username if lead.assigned_to else "Unassigned",
                lead.created_at.strftime("%Y-%m-%d %H:%M:%S") if lead.created_at else "",
            ])

        log_activity(request.user, f"Exported {qs.count()} leads to CSV")
        return response