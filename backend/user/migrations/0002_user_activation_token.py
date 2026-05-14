from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="activation_token",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
    ]
