from django.db import transaction
from rest_framework import generics

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderCreateView(generics.CreateAPIView):
    serializer_class = OrderCreateSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    lookup_field = "reference"

    def get_queryset(self):
        # Scoped to the caller so one user can't read another user's receipt.
        return Order.objects.filter(user=self.request.user).select_related("product")
