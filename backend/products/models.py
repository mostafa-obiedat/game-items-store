from django.db import models
from django.utils.text import slugify


def build_slug(title, taken):
    """Slug for a title, numbered when the same title has already been used."""
    base = slugify(title)[:200] or "item"
    slug = base
    counter = 1
    while slug in taken:
        counter += 1
        slug = f"{base}-{counter}"
    taken.add(slug)
    return slug


class Location(models.TextChoices):
    JORDAN = "JO", "Jordan"
    SAUDI_ARABIA = "SA", "Saudi Arabia"


class Product(models.Model):
    title = models.CharField(max_length=200)
    # Used instead of the id in product URLs. The catalog repeats titles, so the
    # importer adds a counter to keep these unique.
    slug = models.SlugField(max_length=220, unique=True)
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
