from django.urls import path

from user.views import (
    UserRegisterView,
    UserActivateView,
    ResendActivationView,
    UserLoginView,
    UserProfileView,
    UserLogoutView,
)

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="register"),
    path("resend-activation/", ResendActivationView.as_view(), name="resend_activation"),
    path("activate/<int:uid>/<str:token>/", UserActivateView.as_view(), name="activate"),
    path("login/", UserLoginView.as_view(), name="login"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
]
