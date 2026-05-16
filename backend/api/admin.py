from django.contrib import admin
from .models import Product, Order, OrderItem, Queue, Coupon, UserCoupon

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "category", "current_price", "is_available", "image_url"]

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code", "discount_type", "discount_value", "min_order_total",
        "times_used", "max_uses", "max_claims_per_user", "is_active",
    ]


@admin.register(UserCoupon)
class UserCouponAdmin(admin.ModelAdmin):
    list_display = ["user", "coupon", "claimed_at", "is_used", "used_at", "order"]
    list_filter = ["is_used"]

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "coupon", "discount_amount", "created_at"]

@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ["ticket_number", "name", "status", "created_at"]
