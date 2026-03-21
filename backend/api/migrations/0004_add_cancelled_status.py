from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_order_status_and_updated_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("preparing", "Preparing"),
                    ("ready", "Ready"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
