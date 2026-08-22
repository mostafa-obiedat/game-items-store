import secrets

from django.conf import settings
from django.db import models

# No look-alike characters, so a reference can be read out or typed without confusion.
REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
REFERENCE_LENGTH = 8


def generate_reference():
    return "".join(secrets.choice(REFERENCE_ALPHABET) for _ in range(REFERENCE_LENGTH))


class Order(models.Model):
    # Public identifier used in receipt URLs. Random rather than sequential so it
    # cannot be guessed by counting, but short enough to put in front of a customer.
    reference = models.CharField(
        max_length=REFERENCE_LENGTH, unique=True, default=generate_reference, editable=False
    )
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
