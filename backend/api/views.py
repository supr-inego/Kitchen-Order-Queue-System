from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer, Product, Order, Queue
from .serializers import CustomerSerializer, ProductSerializer, OrderSerializer, QueueSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("id")
    serializer_class = CustomerSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-created_at").prefetch_related("items__product")
    serializer_class = OrderSerializer

class QueueViewSet(viewsets.ModelViewSet):
    queryset = Queue.objects.all().order_by("-created_at")
    serializer_class = QueueSerializer

    def create(self, request, *args, **kwargs):
        # Generate the next ticket number
        last_ticket = Queue.objects.count()
        ticket_number = last_ticket + 1

        request.data["ticket_number"] = ticket_number
        request.data["status"] = "waiting"

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="next")
    def next_ticket(self, request):
        next_in_line = (
            Queue.objects.filter(status="waiting")
            .order_by("ticket_number")
            .first()
        )
        if not next_in_line:
            return Response(
                {"detail": "No waiting tickets."},
                status=status.HTTP_404_NOT_FOUND,
            )

        next_in_line.status = "serving"
        next_in_line.save(update_fields=["status"])
        return Response(
            {"ticket": next_in_line.ticket_number, "id": next_in_line.id},
            status=status.HTTP_200_OK,
        )