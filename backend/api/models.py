from django.db import models
from django.conf import settings


class Product(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=60, blank=True, default="")
    is_available = models.BooleanField(default=True)
    image_url = models.URLField(max_length=500, blank=True, default="")

    def __str__(self):
        return self.name


class Coupon(models.Model):
    TYPE_PERCENTAGE = "percentage"
    TYPE_FIXED = "fixed"
    TYPE_FREE_ITEM = "free_item"

    TYPE_CHOICES = [
        (TYPE_PERCENTAGE, "Percentage Off"),
        (TYPE_FIXED, "Fixed Amount Off"),
        (TYPE_FREE_ITEM, "Free Item (cheapest item free)"),
    ]

    code = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.CharField(max_length=255, blank=True, default="")
    discount_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_PERCENTAGE)
    # For percentage: 0-100, for fixed: peso amount, for free_item: ignored
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Minimum order total (before discount) required to use this coupon
    min_order_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # Maximum number of times this coupon can be used (0 = unlimited)
    max_uses = models.PositiveIntegerField(default=0)
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    # How many times one customer may claim this code (0 = unlimited claims per user)
    max_claims_per_user = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code

    @property
    def is_valid(self):
        from django.utils import timezone
        if not self.is_active:
            return False
        if self.max_uses > 0 and self.times_used >= self.max_uses:
            return False
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return True


class UserCoupon(models.Model):
    """Coupon claimed by a customer — must be claimed before use at checkout."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="claimed_coupons",
    )
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name="user_claims",
    )
    claimed_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    order = models.ForeignKey(
        "Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_redemptions",
    )

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_used"]),
        ]

    def __str__(self):
        return f"{self.user_id} — {self.coupon.code}"


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
    coupon = models.ForeignKey(
        Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
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
        Order, on_delete=models.CASCADE, related_name="queue_ticket", null=True, blank=True
    )
    ticket_number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_WAITING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Queue #{self.ticket_number} - {self.name}"
