from django.db import migrations, models

import orders.models


def fill_references(apps, schema_editor):
    """Give existing orders a reference in the new short format."""
    Order = apps.get_model("orders", "Order")
    used = set()

    for order in Order.objects.all():
        reference = orders.models.generate_reference()
        while reference in used:
            reference = orders.models.generate_reference()
        used.add(reference)

        order.new_reference = reference
        order.save(update_fields=["new_reference"])


class Migration(migrations.Migration):
    dependencies = [("orders", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="order",
            name="new_reference",
            field=models.CharField(max_length=8, null=True),
        ),
        migrations.RunPython(fill_references, migrations.RunPython.noop),
        migrations.RemoveField(model_name="order", name="reference"),
        migrations.RenameField(
            model_name="order", old_name="new_reference", new_name="reference"
        ),
        migrations.AlterField(
            model_name="order",
            name="reference",
            field=models.CharField(
                default=orders.models.generate_reference,
                editable=False,
                max_length=8,
                unique=True,
            ),
        ),
    ]
