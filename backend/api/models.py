from django.db import models
from django.conf import settings


class Product(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=60, blank=True, default="")
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
    )
    note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Order #{self.order_id} - {self.product.name}"


class Queue(models.Model):
    STATUS_WAITING = "waiting"
    STATUS_COOKING = "cooking"
    STATUS_SERVING = "serving"
    STATUS_DONE = "done"

    STATUS_CHOICES = [
        (STATUS_WAITING, "Waiting"),
        (STATUS_COOKING, "Cooking"),
        (STATUS_SERVING, "Serving"),
        (STATUS_DONE, "Done"),
    ]

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="queue_ticket",
        null=True,
        blank=True,
    )
    ticket_number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=120)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_WAITING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Queue #{self.ticket_number} - {self.name}"
