from rest_framework import viewsets, status
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

    @action(detail=False, methods=["post"])
    def next(self, request):
        # Mark the next waiting ticket as cooking (or serving) and return it
        next_ticket = Queue.objects.filter(status="waiting").order_by("created_at").first()
        if not next_ticket:
            return Response({"detail": "No waiting ticket available."}, status=status.HTTP_404_NOT_FOUND)

        next_ticket.status = "cooking"
        next_ticket.save()

        serializer = self.get_serializer(next_ticket)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Generate the next ticket number
        last_ticket = Queue.objects.count()
        ticket_number = last_ticket + 1

        request.data["ticket_number"] = ticket_number
        request.data["status"] = "waiting"

        return super().create(request, *args, **kwargs)