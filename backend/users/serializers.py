from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, ClientProfile, TrainerProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'role', 'phone')
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }

    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        """Ensure passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data.get('role', 'client'),
            phone=validated_data.get('phone', ''),
        )
        return user


class ClientProfileSerializer(serializers.ModelSerializer):
    """Serializer for client profile"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ClientProfile
        fields = (
            'id',
            'user_email',
            'user_name',
            'bio',
            'address',
            'location',
            'profile_photo',
            'preferred_specializations',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class TrainerProfileSerializer(serializers.ModelSerializer):
    """Serializer for trainer profile (basic for now)"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'user_email',
            'user_name',
            'bio',
            'verified',
            'profile_photo',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'verified', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    """Enhanced user serializer with profile data"""

    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'role',
            'phone',
            'email_verified',
            'date_joined',
            'profile',
        )
        read_only_fields = ('id', 'email', 'role', 'email_verified', 'date_joined')

    def get_profile(self, obj):
        """Return appropriate profile based on user role"""
        if obj.role == 'client' and hasattr(obj, 'client_profile'):
            return ClientProfileSerializer(obj.client_profile).data
        elif obj.role == 'trainer' and hasattr(obj, 'trainer_profile'):
            return TrainerProfileSerializer(obj.trainer_profile).data
        return None
