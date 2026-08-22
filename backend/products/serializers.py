from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    location_display = serializers.CharField(source="get_location_display", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "title",
            "description",
            "price",
            "location",
            "location_display",
        )
