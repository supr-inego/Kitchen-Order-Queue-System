from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Product, Order, OrderItem, Queue, Coupon, UserCoupon
from . import coupon_service
from .image_url import normalize_image_url, image_url_help_error


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "current_price", "category", "is_available", "image_url"]

    def validate_image_url(self, value):
        normalized = normalize_image_url(value)
        if not normalized:
            return ""
        err = image_url_help_error(normalized)
        if err:
            raise serializers.ValidationError(err)
        return normalized


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)
    claims_count = serializers.SerializerMethodField()
    unused_claims_count = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "description", "discount_type", "discount_value",
            "min_order_total", "max_uses", "max_claims_per_user", "times_used",
            "is_active", "valid_from", "valid_until", "created_at", "is_valid",
            "claims_count", "unused_claims_count",
        ]
        read_only_fields = ["times_used", "created_at", "claims_count", "unused_claims_count"]

    def get_claims_count(self, obj):
        return obj.user_claims.count()

    def get_unused_claims_count(self, obj):
        return obj.user_claims.filter(is_used=False).count()


class UserCouponSerializer(serializers.ModelSerializer):
    coupon = CouponSerializer(read_only=True)
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)

    class Meta:
        model = UserCoupon
        fields = [
            "id", "coupon", "coupon_code", "claimed_at", "is_used", "used_at", "order",
        ]


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)


class CouponClaimSerializer(serializers.Serializer):
    code = serializers.CharField()


class OrderItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product", "quantity"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value


class OrderItemReadSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "unit_price"]


class QueueSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Queue
        fields = ["id", "order", "order_id", "ticket_number", "name", "customer_name", "status", "created_at"]
        read_only_fields = ["ticket_number", "name", "created_at"]

    def get_customer_name(self, obj):
        if obj.order and obj.order.user:
            u = obj.order.user
            full = f"{u.first_name} {u.last_name}".strip()
            return full or u.email
        return obj.name


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    items_payload = OrderItemWriteSerializer(many=True, write_only=True, required=False)
    queue_ticket = QueueSerializer(read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    coupon_code_display = serializers.CharField(source="coupon.code", read_only=True, default=None)
    coupon_info = CouponSerializer(source="coupon", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "user", "customer_name", "customer_email",
            "note", "created_at", "updated_at", "status",
            "items", "items_payload",
            "coupon_code", "coupon_code_display", "coupon_info", "discount_amount",
            "subtotal", "total_price",
            "queue_ticket",
        ]
        read_only_fields = ["created_at", "updated_at", "user", "discount_amount"]

    def get_customer_name(self, obj):
        if obj.user:
            u = obj.user
            full = f"{u.first_name} {u.last_name}".strip()
            return full or u.email
        return "Guest"

    def get_customer_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_subtotal(self, obj):
        return sum(float(it.unit_price) * it.quantity for it in obj.items.all())

    def get_total_price(self, obj):
        sub = self.get_subtotal(obj)
        return max(0, sub - float(obj.discount_amount or 0))

    def validate_status(self, value):
        normalized = (value or "").strip().lower()
        aliases = {"prepared": "preparing", "complete": "completed", "done": "completed"}
        return aliases.get(normalized, normalized)

    def validate_items_payload(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def _compute_discount(self, coupon, items_data):
        """Return (coupon_obj, discount_amount) given validated items_data."""
        subtotal = sum(
            float(item["product"].current_price) * item["quantity"]
            for item in items_data
        )
        if not coupon or not coupon.is_valid:
            return None, 0
        if subtotal < float(coupon.min_order_total):
            return None, 0

        if coupon.discount_type == Coupon.TYPE_PERCENTAGE:
            disc = subtotal * float(coupon.discount_value) / 100
        elif coupon.discount_type == Coupon.TYPE_FIXED:
            disc = float(coupon.discount_value)
        elif coupon.discount_type == Coupon.TYPE_FREE_ITEM:
            # Cheapest item in cart is free (1 unit)
            cheapest = min(
                float(item["product"].current_price)
                for item in items_data
            )
            disc = cheapest
        else:
            disc = 0

        return coupon, min(disc, subtotal)

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_payload", [])
        coupon_code = validated_data.pop("coupon_code", "").strip().upper()
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user

        # Resolve coupon
        coupon_obj = None
        user_coupon = None
        if coupon_code:
            coupon_obj = coupon_service.get_coupon(coupon_code)
            if not coupon_obj:
                raise serializers.ValidationError({"coupon_code": "Invalid coupon code."})
            if request and request.user.is_authenticated:
                if getattr(request.user, "role", None) == "customer":
                    try:
                        user_coupon = coupon_service.require_claimed_coupon(request.user, coupon_obj)
                    except ValueError as exc:
                        raise serializers.ValidationError({"coupon_code": str(exc)})

        coupon_obj, disc_amount = self._compute_discount(coupon_obj, items_data)

        validated_data["coupon"] = coupon_obj
        validated_data["discount_amount"] = disc_amount
        order = Order.objects.create(**validated_data)

        for item in items_data:
            product = item["product"]
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item["quantity"],
                unit_price=product.current_price,
            )

        if coupon_obj:
            coupon_obj.times_used += 1
            coupon_obj.save(update_fields=["times_used"])
            if user_coupon:
                coupon_service.mark_claim_used(user_coupon, order)

        last_ticket = Queue.objects.order_by("-ticket_number").first()
        next_ticket = 1 if last_ticket is None else last_ticket.ticket_number + 1

        user = validated_data.get("user")
        if user:
            full = f"{user.first_name} {user.last_name}".strip()
            display_name = full or user.email
        else:
            display_name = "Guest"

        Queue.objects.create(order=order, ticket_number=next_ticket, name=display_name)
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data.pop("items_payload", None)
        validated_data.pop("coupon_code", None)
        previous_status = instance.status
        instance = super().update(instance, validated_data)

        if hasattr(instance, "queue_ticket") and previous_status != instance.status:
            status_map = {
                Order.STATUS_PENDING: Queue.STATUS_WAITING,
                Order.STATUS_PREPARING: Queue.STATUS_COOKING,
                Order.STATUS_READY: Queue.STATUS_SERVING,
                Order.STATUS_COMPLETED: Queue.STATUS_DONE,
            }
            queue_status = status_map.get(instance.status)
            if queue_status:
                q = instance.queue_ticket
                if q.status != queue_status:
                    q.status = queue_status
                    q.save(update_fields=["status"])

        return instance
