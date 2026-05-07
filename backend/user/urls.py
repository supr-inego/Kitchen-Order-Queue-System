from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from user.views import (
    UserRootView,
    UserRegistrationView,
    UserLoginView,
    UserProfileView,
    UserLogoutView,
)

urlpatterns = [
    path('', UserRootView.as_view(), name='user-root'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
