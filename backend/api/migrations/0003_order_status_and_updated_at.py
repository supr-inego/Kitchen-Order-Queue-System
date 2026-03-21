from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_queue"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("preparing", "Preparing"),
                    ("ready", "Ready"),
                    ("completed", "Completed"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
