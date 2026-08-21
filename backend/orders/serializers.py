from rest_framework import serializers

from products.models import Product
from products.serializers import ProductSerializer

from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    """Receipt payload returned after a purchase and by the receipt endpoint."""

    product = ProductSerializer(read_only=True)
    buyer = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Order
        fields = ("reference", "product", "price", "buyer", "created_at")


class OrderCreateSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product"
    )

    def create(self, validated_data):
        product = validated_data["product"]
        return Order.objects.create(
            user=self.context["request"].user,
            product=product,
            price=product.price,
        )

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data
