from django.db import transaction
from rest_framework import serializers

from .models import Product, Order, OrderItem, Queue


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "current_price", "category", "is_available"]


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
        fields = [
            "id", "order", "order_id", "ticket_number",
            "name", "customer_name", "status", "created_at",
        ]
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
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "user", "customer_name", "customer_email",
            "note", "created_at", "updated_at", "status",
            "items", "items_payload", "queue_ticket", "total_price",
        ]
        read_only_fields = ["created_at", "updated_at", "user"]

    def get_customer_name(self, obj):
        if obj.user:
            u = obj.user
            full = f"{u.first_name} {u.last_name}".strip()
            return full or u.email
        return "Guest"

    def get_customer_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_total_price(self, obj):
        return sum(
            float(it.unit_price) * it.quantity
            for it in obj.items.all()
        )

    def validate_status(self, value):
        normalized = (value or "").strip().lower()
        aliases = {"prepared": "preparing", "complete": "completed", "done": "completed"}
        return aliases.get(normalized, normalized)

    def validate_items_payload(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_payload", [])
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user

        order = Order.objects.create(**validated_data)

        for item in items_data:
            product = item["product"]
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item["quantity"],
                unit_price=product.current_price,
            )

        last_ticket = Queue.objects.order_by("-ticket_number").first()
        next_ticket_number = 1 if last_ticket is None else last_ticket.ticket_number + 1

        user = validated_data.get("user")
        if user:
            full = f"{user.first_name} {user.last_name}".strip()
            display_name = full or user.email
        else:
            display_name = "Guest"

        Queue.objects.create(
            order=order,
            ticket_number=next_ticket_number,
            name=display_name,
            status=Queue.STATUS_WAITING,
        )

        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        validated_data.pop("items_payload", None)
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
                queue = instance.queue_ticket
                if queue.status != queue_status:
                    queue.status = queue_status
                    queue.save(update_fields=["status"])

        return instance
