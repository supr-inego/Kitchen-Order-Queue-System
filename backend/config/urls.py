from django.contrib import admin
from django.urls import path, re_path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/user/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("api.urls")),
    re_path(r"^api/user/?", include("user.urls")),
]