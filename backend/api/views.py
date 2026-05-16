import ipaddress
from urllib.parse import urlparse

import requests
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from .image_url import normalize_image_url
from .models import Product, Order, Queue, Coupon, UserCoupon
from . import coupon_service
from .serializers import (
    ProductSerializer, OrderSerializer, QueueSerializer,
    CouponSerializer, CouponValidateSerializer, CouponClaimSerializer,
    UserCouponSerializer,
)


class IsAdminRole(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and getattr(request.user, "role", None) == "admin"


class IsCustomerRole(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and getattr(request.user, "role", None) == "customer"


def _url_safe_for_proxy(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.hostname
    if not host:
        return False
    if host in ("localhost", "127.0.0.1") or host.endswith(".local"):
        return False
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False
    except ValueError:
        pass
    return True


class ImageProxyView(APIView):
    """GET /api/image-proxy/?url=... — serve external images (avoids hotlink blocks)."""
    permission_classes = [AllowAny]

    def get(self, request):
        raw = request.query_params.get("url", "")
        url = normalize_image_url(raw)
        if not url or not _url_safe_for_proxy(url):
            return Response({"detail": "Invalid image URL."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            upstream = requests.get(
                url,
                timeout=8,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; CrammersRestaurant/1.0)",
                    "Accept": "image/*,*/*;q=0.8",
                },
            )
            upstream.raise_for_status()
        except requests.RequestException as exc:
            return Response(
                {"detail": f"Could not load image: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = upstream.headers.get("Content-Type", "image/jpeg")
        if not content_type.startswith("image/"):
            return Response(
                {"detail": "URL did not return an image. Use a direct .jpg/.png link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        resp = HttpResponse(upstream.content, content_type=content_type)
        resp["Cache-Control"] = "public, max-age=86400"
        return resp


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminRole()]


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by("-created_at")
    serializer_class = CouponSerializer

    def get_permissions(self):
        # Custom actions must be allowed here — @action permission_classes alone is not enough in DRF.
        if self.action in ("validate_coupon", "claim", "mine", "available"):
            return [IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ("list", "retrieve") and getattr(self.request.user, "role", None) == "admin":
            return qs.prefetch_related("user_claims")
        return qs

    @action(detail=False, methods=["post"], url_path="validate")
    def validate_coupon(self, request):
        """POST /api/coupons/validate/ — preview discount (customer must have claimed first)."""
        ser = CouponValidateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        code = coupon_service.normalize_code(ser.validated_data["code"])
        order_total = float(ser.validated_data.get("order_total") or 0)
        coupon = coupon_service.get_coupon(code)
        if not coupon:
            return Response({"detail": "Coupon not found."}, status=status.HTTP_404_NOT_FOUND)

        if not coupon.is_valid:
            return Response({"detail": "This coupon is expired or no longer active."}, status=status.HTTP_400_BAD_REQUEST)

        role = getattr(request.user, "role", None)
        if role == "customer":
            if not coupon_service.user_has_unused_claim(request.user, coupon):
                return Response(
                    {
                        "detail": "Claim this coupon on the Coupons page before using it at checkout.",
                        "needs_claim": True,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if order_total < float(coupon.min_order_total):
            return Response(
                {"detail": f"Minimum order of ₱{coupon.min_order_total} required to use this coupon."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        disc = coupon_service.coupon_discount_preview(coupon, order_total)
        return Response({
            "coupon": CouponSerializer(coupon).data,
            "discount_preview": disc,
        })

    @action(detail=False, methods=["post"], url_path="claim")
    def claim(self, request):
        """POST /api/coupons/claim/ — add coupon to customer wallet."""
        if getattr(request.user, "role", None) != "customer":
            return Response({"detail": "Only customers can claim coupons."}, status=status.HTTP_403_FORBIDDEN)

        ser = CouponClaimSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            uc = coupon_service.claim_coupon_for_user(request.user, ser.validated_data["code"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": f"Coupon {uc.coupon.code} added to your wallet!",
                "claim": UserCouponSerializer(uc).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        """GET /api/coupons/mine/ — customer's claimed coupons."""
        if getattr(request.user, "role", None) != "customer":
            return Response({"detail": "Only customers have a coupon wallet."}, status=status.HTTP_403_FORBIDDEN)

        used = request.query_params.get("used")
        qs = UserCoupon.objects.filter(user=request.user).select_related("coupon").order_by("-claimed_at")
        if used == "false":
            qs = qs.filter(is_used=False)
        elif used == "true":
            qs = qs.filter(is_used=True)

        return Response(UserCouponSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """GET /api/coupons/available/ — active promotions customers can claim (no search)."""
        if getattr(request.user, "role", None) != "customer":
            return Response(
                {"detail": "Only customers can browse claimable coupons."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(coupon_service.list_available_coupons_for_user(request.user))


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = (
            Order.objects.all()
            .prefetch_related("items__product", "queue_ticket")
            .select_related("user", "coupon")
            .order_by("-created_at")
        )
        if getattr(user, "role", None) != "admin":
            qs = qs.filter(user=user)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def destroy(self, request, *args, **kwargs):
        if getattr(request.user, "role", None) != "admin":
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class QueueViewSet(viewsets.ModelViewSet):
    serializer_class = QueueSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        return (
            Queue.objects.all()
            .select_related("order", "order__user")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Queue tickets are created automatically when an order is placed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def perform_update(self, serializer):
        queue = serializer.save()
        if not queue.order:
            return
        status_map = {
            Queue.STATUS_WAITING: Order.STATUS_PENDING,
            Queue.STATUS_COOKING: Order.STATUS_PREPARING,
            Queue.STATUS_SERVING: Order.STATUS_READY,
            Queue.STATUS_DONE: Order.STATUS_COMPLETED,
        }
        new_order_status = status_map.get(queue.status)
        if new_order_status and queue.order.status != new_order_status:
            queue.order.status = new_order_status
            queue.order.save(update_fields=["status", "updated_at"])

    @action(detail=False, methods=["post"], url_path="next")
    def next_ticket(self, request):
        next_in_line = Queue.objects.filter(status=Queue.STATUS_WAITING).order_by("ticket_number").first()
        if not next_in_line:
            return Response({"detail": "No waiting tickets."}, status=status.HTTP_404_NOT_FOUND)
        next_in_line.status = Queue.STATUS_COOKING
        next_in_line.save(update_fields=["status"])
        if next_in_line.order and next_in_line.order.status != Order.STATUS_PREPARING:
            next_in_line.order.status = Order.STATUS_PREPARING
            next_in_line.order.save(update_fields=["status", "updated_at"])
        return Response({
            "ticket": next_in_line.ticket_number,
            "id": next_in_line.id,
            "status": next_in_line.status,
            "order_id": next_in_line.order_id,
        })
