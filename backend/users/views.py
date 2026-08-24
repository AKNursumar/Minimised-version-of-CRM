from django.contrib.auth import authenticate
from django.shortcuts import render, redirect
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .permissions import AdminOnly
from .serializers import UserSerializer, CurrentUserSerializer

class CurrentUserView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AdminOnly]


def login_view(request):

    if request.method == 'GET':
        return render(request, "login.html")

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
