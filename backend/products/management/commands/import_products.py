import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from products.models import Location, Product

REQUIRED_COLUMNS = {"id", "title", "description", "price", "location"}
DEFAULT_PATH = Path(settings.BASE_DIR) / "data" / "items.csv"


class Command(BaseCommand):
    help = "Import products from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument(
            "path",
            nargs="?",
            default=str(DEFAULT_PATH),
            help="Path to the CSV file (defaults to data/items.csv).",
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.exists():
            raise CommandError(f"CSV file not found: {path}")

        created = updated = skipped = 0

        with path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            if missing:
                raise CommandError(f"CSV is missing columns: {', '.join(sorted(missing))}")

            # One transaction for the whole file so a bad run leaves nothing half-imported.
            with transaction.atomic():
                for line, row in enumerate(reader, start=2):
                    parsed = self.parse_row(row, line)
                    if parsed is None:
                        skipped += 1
                        continue

                    product_id, fields = parsed
                    _, was_created = Product.objects.update_or_create(
                        id=product_id, defaults=fields
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported {created} new, updated {updated}, skipped {skipped}."
            )
        )

    def parse_row(self, row, line):
        """Validate a CSV row. Returns (id, fields) or None if the row is unusable."""
        try:
            product_id = int(row["id"])
        except (TypeError, ValueError):
            self.warn(line, f"invalid id {row.get('id')!r}")
            return None

        title = (row.get("title") or "").strip()
        if not title:
            self.warn(line, "missing title")
            return None

        try:
            price = Decimal(str(row["price"]).strip())
        except (InvalidOperation, TypeError, AttributeError):
            self.warn(line, f"invalid price {row.get('price')!r}")
            return None

        if price < 0:
            self.warn(line, "negative price")
            return None

        location = (row.get("location") or "").strip().upper()
        if location not in Location.values:
            self.warn(line, f"unknown location {location!r}")
            return None

        return product_id, {
            "title": title,
            "description": (row.get("description") or "").strip(),
            "price": price,
            "location": location,
        }

    def warn(self, line, message):
        self.stderr.write(self.style.WARNING(f"Row {line}: {message}, skipping."))
