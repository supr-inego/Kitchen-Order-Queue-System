import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api", "0004_product_image_url_coupon_order_coupon_discount"),
    ]

    operations = [
        migrations.AddField(
            model_name="coupon",
            name="max_claims_per_user",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.CreateModel(
            name="UserCoupon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("claimed_at", models.DateTimeField(auto_now_add=True)),
                ("is_used", models.BooleanField(default=False)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "coupon",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_claims",
                        to="api.coupon",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="coupon_redemptions",
                        to="api.order",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="claimed_coupons",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [models.Index(fields=["user", "is_used"], name="api_usercou_user_id_8a0f0d_idx")],
            },
        ),
    ]
