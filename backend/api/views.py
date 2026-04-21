from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Customer, Product, Order, Queue
from .serializers import CustomerSerializer, ProductSerializer, OrderSerializer, QueueSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Management of customers. Requires authentication.
    """
    queryset = Customer.objects.all().order_by("id")
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]


class ProductViewSet(viewsets.ModelViewSet):
    """
    The Menu/Product list. Open to everyone so customers can browse.
    """
    queryset = Product.objects.all().order_by("id")
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class OrderViewSet(viewsets.ModelViewSet):
    """
    Order management. Requires authentication for staff/system.
    """
    queryset = Order.objects.all().order_by("-created_at").prefetch_related("items__product")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


class QueueViewSet(viewsets.ModelViewSet):
    """
    Kitchen Queue management. Requires authentication.
    """
    queryset = Queue.objects.all().order_by("-created_at")
    serializer_class = QueueSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Generate the next ticket number automatically
        last_ticket = Queue.objects.count()
        ticket_number = last_ticket + 1

        request.data["ticket_number"] = ticket_number
        request.data["status"] = "waiting"

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="next")
    def next_ticket(self, request):
        """
        Pull the next waiting ticket into 'serving' status.
        """
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

    @action(detail=True, methods=["post"], url_path="complete")
    def complete_ticket(self, request, pk=None):
        """
        Mark a specific ticket as 'completed'.
        Usage: POST /api/queue/<id>/complete/
        """
        ticket = self.get_object()
        
        if ticket.status != "serving":
            return Response(
                {"detail": "Only tickets currently being served can be completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket.status = "completed"
        ticket.save(update_fields=["status"])
        
        return Response(
            {
                "status": "ticket completed", 
                "ticket_number": ticket.ticket_number,
                "message": f"Ticket #{ticket.ticket_number} is now finished."
            },
            status=status.HTTP_200_OK
        )