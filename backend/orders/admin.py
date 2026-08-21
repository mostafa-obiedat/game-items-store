from django.contrib import admin

from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "user", "product", "price", "created_at")
    list_filter = ("created_at",)
    search_fields = ("reference",)
