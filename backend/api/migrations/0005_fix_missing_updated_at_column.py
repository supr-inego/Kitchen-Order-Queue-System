from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_add_cancelled_status"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE api_order "
                "ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone "
                "DEFAULT CURRENT_TIMESTAMP NOT NULL;"
            ),
            reverse_sql=(
                "ALTER TABLE api_order "
                "DROP COLUMN IF EXISTS updated_at;"
            ),
        ),
    ]
