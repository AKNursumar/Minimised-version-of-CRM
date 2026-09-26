from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import login_view, dashboard, CurrentUserView, APILoginView


urlpatterns = [
    path("login/", login_view, name="login"),
    path("dashboard/", dashboard, name="dashboard"),
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("auth/login/", APILoginView.as_view(), name="api-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="api-refresh"),
    path("api/auth/me/", CurrentUserView.as_view(), name="api-auth-me"),
    path("api/auth/login/", APILoginView.as_view(), name="api-auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="api-auth-refresh"),
    path("api/token/", APILoginView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]