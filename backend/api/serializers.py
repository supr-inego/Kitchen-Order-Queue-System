from django.db import transaction
from rest_framework import serializers

from .models import Customer, Product, Order, OrderItem, Queue


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name", "email"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "current_price"]


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

    class Meta:
        model = Queue
        fields = [
            "id",
            "order",
            "order_id",
            "ticket_number",
            "name",
            "status",
            "created_at",
        ]
        read_only_fields = ["ticket_number", "name", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    items_payload = OrderItemWriteSerializer(many=True, write_only=True)
    queue_ticket = QueueSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "created_at",
            "updated_at",
            "status",
            "items",
            "items_payload",
            "queue_ticket",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_status(self, value):
        normalized = (value or "").strip().lower()
        aliases = {
            "prepared": "preparing",
            "complete": "completed",
            "done": "completed",
        }
        return aliases.get(normalized, normalized)

    def validate_items_payload(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_payload", [])
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

        Queue.objects.create(
            order=order,
            ticket_number=next_ticket_number,
            name=order.customer.name,
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