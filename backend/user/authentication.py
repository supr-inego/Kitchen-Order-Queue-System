from django.contrib.auth.backends import ModelBackend

from user.models import User


class EmailBackend(ModelBackend):
    """Authenticate with email + password (USERNAME_FIELD is email)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        email = kwargs.get("email") or username
        if email is None or password is None:
            return None
        email = User.objects.normalize_email(email)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
