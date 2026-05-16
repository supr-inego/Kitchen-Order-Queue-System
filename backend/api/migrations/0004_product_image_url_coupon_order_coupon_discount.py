from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_remove_order_customer_delete_customer'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='image_url',
            field=models.URLField(blank=True, default='', max_length=500),
        ),
        migrations.CreateModel(
            name='Coupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, max_length=30, unique=True)),
                ('description', models.CharField(blank=True, default='', max_length=255)),
                ('discount_type', models.CharField(choices=[('percentage', 'Percentage Off'), ('fixed', 'Fixed Amount Off'), ('free_item', 'Free Item (cheapest item free)')], default='percentage', max_length=20)),
                ('discount_value', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('min_order_total', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('max_uses', models.PositiveIntegerField(default=0)),
                ('times_used', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('valid_from', models.DateTimeField(blank=True, null=True)),
                ('valid_until', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.AddField(
            model_name='order',
            name='coupon',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to='api.coupon'),
        ),
        migrations.AddField(
            model_name='order',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
