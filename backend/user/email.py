import uuid
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_activation_email(user, request):
    """
    Generate a one-time activation token, save it on the user, then
    send an HTML activation email.
    """
    # Generate a secure token and store it on the user
    token = uuid.uuid4().hex
    user.activation_token = token
    user.save(update_fields=["activation_token"])

    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    activation_url = f"{frontend_base}/activate/{user.pk}/{token}/"

    # Direct API link (works even if frontend URL is wrong during dev)
    scheme = "https" if request.is_secure() else "http"
    host = request.get_host()
    api_activation_url = f"{scheme}://{host}/api/user/activate/{user.pk}/{token}/"

    html_message = render_to_string(
        "emails/activation.html",
        {
            "user": user,
            "url": activation_url,
            "api_url": api_activation_url,
        },
    )
    plain_message = strip_tags(html_message)

    send_mail(
        subject="Activate your Kitchen Order System account",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
