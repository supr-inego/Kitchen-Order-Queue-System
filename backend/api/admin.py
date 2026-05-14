from django.contrib import admin
from .models import Product, Order, OrderItem, Queue

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "category", "current_price", "is_available"]

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "created_at"]

@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ["ticket_number", "name", "status", "created_at"]
