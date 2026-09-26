import csv
from django.db.models import Q
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from users.permissions import AllCRMUsers
from users.activity import log_activity
from .models import Contact
from .serializers import ContactSerializer


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