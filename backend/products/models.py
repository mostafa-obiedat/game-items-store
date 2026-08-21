from django.db import models


class Location(models.TextChoices):
    JORDAN = "JO", "Jordan"
    SAUDI_ARABIA = "SA", "Saudi Arabia"


class Product(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # Money is stored as Decimal, never float, so prices stay exact.
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=2, choices=Location.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [models.Index(fields=["location"])]

    def __str__(self):
        return f"{self.title} ({self.location})"
