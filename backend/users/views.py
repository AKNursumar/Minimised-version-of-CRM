from django.contrib.auth import authenticate
from django.shortcuts import render, redirect
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, ActivityLog
from .permissions import AdminOnly, AllCRMUsers
from .serializers import UserSerializer, CurrentUserSerializer, ActivityLogSerializer
from .activity import log_activity

class CurrentUserView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AdminOnly]


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = ActivityLog.objects.all().order_by("-created_at")
    serializer_class = ActivityLogSerializer
    permission_classes = [AllCRMUsers]

    def get_queryset(self):
        user = self.request.user
        if user.role in ["ADMIN", "MANAGER"]:
            return ActivityLog.objects.all().order_by("-created_at")
        return ActivityLog.objects.filter(user=user).order_by("-created_at")


class APILoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        log_activity(user, f"User {user.username} logged in")

        refresh = RefreshToken.for_user(user)
        user_data = CurrentUserSerializer(user).data
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_data,
        })


def login_view(request):

    if request.method == 'GET':
        return render(request, "login.html")

    if request.content_type == 'application/json':
        import json
        from django.http import JsonResponse
        try:
            body = json.loads(request.body.decode('utf-8'))
        except Exception:
            body = {}
        username = body.get("username")
        passwd = body.get("password")
        user = authenticate(request, username=username, password=passwd)
        if user is None:
            return JsonResponse({"error": "Invalid username or password."}, status=400)
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": CurrentUserSerializer(user).data
        })

    username = request.POST.get("username")
    passwd = request.POST.get("password")

    user = authenticate( request, username=username, password=passwd)

    if user is None:
        return render(
            request,
            "login.html",
            {
                "error": "Invalid username or password"
            }
        )

    refresh = RefreshToken.for_user(user)

    response = redirect("dashboard")

    response.set_cookie(
        "access_token",
        str(refresh.access_token),
        httponly=True,
        secure=False,
        samesite="Lax",
    )

    response.set_cookie(
        "refresh_token",
        str(refresh),
        httponly=True,
        secure=False,
        samesite="Lax",
    )

    return response

def dashboard(request):
    return render(request, "dashboard.html")
