from django.urls import path

from .views import login_view, dashboard, CurrentUserView


urlpatterns = [
    path("login/", login_view, name="login"),
    path("dashboard/", dashboard, name="dashboard"),
    path(
            "auth/me/",
            CurrentUserView.as_view(),
            name="current-user"
        ),
]