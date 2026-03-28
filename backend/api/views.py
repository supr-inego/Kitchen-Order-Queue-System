from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Customer, Product, Order, Queue
from .serializers import (
    CustomerSerializer,
    ProductSerializer,
    OrderSerializer,
    QueueSerializer,
)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("id")
    serializer_class = CustomerSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.all()
        .select_related("customer")
        .prefetch_related("items__product", "queue_ticket")
        .order_by("-created_at")
    )
    serializer_class = OrderSerializer


class QueueViewSet(viewsets.ModelViewSet):
    queryset = (
        Queue.objects.all()
        .select_related("order", "order__customer")
        .order_by("-created_at")
    )
    serializer_class = QueueSerializer

    def create(self, request, *args, **kwargs):
        return Response(
            {"detail": "Queue tickets are created automatically when an order is created."},
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
        next_in_line = (
            Queue.objects.filter(status=Queue.STATUS_WAITING)
            .order_by("ticket_number")
            .first()
        )

        if not next_in_line:
            return Response(
                {"detail": "No waiting tickets."},
                status=status.HTTP_404_NOT_FOUND,
            )

        next_in_line.status = Queue.STATUS_COOKING
        next_in_line.save(update_fields=["status"])

        if next_in_line.order and next_in_line.order.status != Order.STATUS_PREPARING:
            next_in_line.order.status = Order.STATUS_PREPARING
            next_in_line.order.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "ticket": next_in_line.ticket_number,
                "id": next_in_line.id,
                "status": next_in_line.status,
                "order_id": next_in_line.order_id,
            },
            status=status.HTTP_200_OK,
        )