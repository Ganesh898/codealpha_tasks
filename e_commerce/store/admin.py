from django.contrib import admin
from .models import Order, PasswordResetRequest

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "user", "amount", "payment_status", "created_at")
    search_fields = ("customer_name", "address", "user__username")
    list_filter = ("payment_status", "created_at")

@admin.register(PasswordResetRequest)
class PasswordResetRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "reset_code", "expires_at", "used", "created_at")
    search_fields = ("user__username", "reset_code")
    list_filter = ("used", "created_at")