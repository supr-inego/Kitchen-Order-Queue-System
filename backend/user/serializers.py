from rest_framework import serializers
from django.contrib.auth import authenticate
from user.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name",
            "address", "age", "birthday", "phone",
            "role", "is_active", "date_joined", "updated_at",
        ]
        read_only_fields = ["id", "role", "is_active", "date_joined", "updated_at"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "email", "password", "password_confirm",
            "first_name", "last_name", "address", "age", "birthday", "phone",
        ]

    def validate_email(self, value):
        return value.lower()

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        # Always customer — admins are created via Django admin / createsuperuser
        validated_data["role"] = "customer"
        validated_data["is_active"] = False
        return User.objects.create_user(**validated_data)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, data):
        email = data.get("email", "").lower()
        password = data.get("password")
        if not email or not password:
            raise serializers.ValidationError("Must include email and password.")
        user = authenticate(request=self.context.get("request"), email=email, username=email, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError(
                "Account not activated. Please check your email for the activation link."
            )
        data["user"] = user
        return data


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "address", "age", "birthday", "phone"]
