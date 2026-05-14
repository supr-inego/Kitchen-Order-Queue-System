from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0002_user_activation_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Admin'), ('customer', 'Customer')],
                default='customer',
                max_length=20,
            ),
        ),
    ]
