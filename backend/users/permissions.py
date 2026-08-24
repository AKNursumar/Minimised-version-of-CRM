from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):

    allowed_roles = []

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        return request.user.role in self.allowed_roles

class AdminOnly(RolePermission):

    allowed_roles = ["ADMIN"]


class AdminManager(RolePermission):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
    ]


class AllCRMUsers(RolePermission):

    allowed_roles = [
        "ADMIN",
        "MANAGER",
        "SALES_EXECUTIVE",
    ]