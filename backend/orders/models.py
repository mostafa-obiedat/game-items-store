import uuid

from django.conf import settings
from django.db import models


class Order(models.Model):
    # Public identifier used in receipt URLs, so order ids aren't guessable.
    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="orders"
    )
    # Copied from the product at purchase time; the catalog price can change later
    # and a receipt has to keep showing what was actually paid.
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.reference}"
