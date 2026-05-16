from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from user.models import User
from user.serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserUpdateSerializer,
)
from user.email import send_activation_email


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()  # is_active=False set by serializer

            # Send activation email
            try:
                send_activation_email(user, request)
            except Exception as e:
                # Don't fail registration if mail server is misconfigured —
                # but log the error so developers notice.
                import logging
                logging.getLogger(__name__).error(
                    "Failed to send activation email to %s: %s", user.email, e
                )

            return Response(
                {
                    "message": (
                        "Registration successful! Please check your email "
                        "to activate your account before logging in."
                    )
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserActivateView(APIView):
    """GET /api/user/activate/<uid>/<token>/ — activates the account."""
    permission_classes = [AllowAny]

    def get(self, request, uid, token):
        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({"detail": "Invalid activation link."}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotent: already active (e.g. React Strict Mode double-request)
        if user.is_active:
            return Response(
                {"message": "Account is already active. You can log in."},
                status=status.HTTP_200_OK,
            )

        if not user.activation_token or user.activation_token != token:
            return Response(
                {"detail": "Invalid or expired activation token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.activation_token = ""
        user.save(update_fields=["is_active", "activation_token"])

        return Response(
            {"message": "Account activated successfully! You can now log in."},
            status=status.HTTP_200_OK,
        )


class ResendActivationView(APIView):
    """POST /api/user/resend-activation/  body: { "email": "..." }"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether email exists
            return Response(
                {"message": "If that email is registered and not yet active, we sent a new activation link."},
                status=status.HTTP_200_OK,
            )

        if user.is_active:
            return Response({"message": "This account is already active. You can log in."})

        try:
            send_activation_email(user, request)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("Resend activation failed for %s: %s", email, e)
            return Response(
                {"detail": "Could not send email. Check server email settings and try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"message": "Activation email sent. Please check your inbox (and spam folder)."},
            status=status.HTTP_200_OK,
        )


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            user = serializer.validated_data["user"]
            tokens = get_tokens(user)

            return Response(
                {
                    "user": UserSerializer(user).data,
                    **tokens,
                    "message": "Login successful",
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                return Response(
                    {"detail": "Invalid refresh token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response({"message": "Logged out"}, status=status.HTTP_205_RESET_CONTENT)
