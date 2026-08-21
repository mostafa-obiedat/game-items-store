from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "price", "location")
    list_filter = ("location",)
    search_fields = ("title", "description")
