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


class OrderItemReadSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemReadSerializer(many=True, read_only=True)
    items_payload = OrderItemWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["id", "customer", "created_at", "updated_at", "status", "items", "items_payload"]

    def validate_status(self, value):
        normalized = (value or "").strip().lower()
        aliases = {
            "prepared": "preparing",
            "complete": "completed",
            "done": "completed",
        }
        return aliases.get(normalized, normalized)

    def create(self, validated_data):
        items_data = validated_data.pop("items_payload", [])
        order = Order.objects.create(**validated_data)

        for item in items_data:
            product = item["product"]
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item["quantity"],
                unit_price=product.current_price,  # snapshot
            )
        return order

class QueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Queue
        fields = '__all__'