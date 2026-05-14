from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from .models import Product, Order, Queue
from .serializers import ProductSerializer, OrderSerializer, QueueSerializer


class IsAdminRole(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and getattr(request.user, "role", None) == "admin"


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminRole()]


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = (
            Order.objects.all()
            .prefetch_related("items__product", "queue_ticket")
            .select_related("user")
            .order_by("-created_at")
        )
        # Customers only see their own orders
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
        next_in_line = (
            Queue.objects.filter(status=Queue.STATUS_WAITING)
            .order_by("ticket_number")
            .first()
        )
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
        }, status=status.HTTP_200_OK)
