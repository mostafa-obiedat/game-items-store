from django.db import migrations, models

from products.models import build_slug


def fill_slugs(apps, schema_editor):
    Product = apps.get_model("products", "Product")
    taken = set()

    for product in Product.objects.order_by("id"):
        product.slug = build_slug(product.title, taken)
        product.save(update_fields=["slug"])


class Migration(migrations.Migration):
    dependencies = [("products", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="slug",
            # Indexed only once the field becomes unique, otherwise Postgres is asked
            # to create the same lookup index twice.
            field=models.SlugField(max_length=220, null=True, db_index=False),
        ),
        migrations.RunPython(fill_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="product",
            name="slug",
            field=models.SlugField(max_length=220, unique=True),
        ),
    ]
