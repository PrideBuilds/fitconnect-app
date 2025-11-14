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
    """Comprehensive client fitness profile serializer"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    age = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()

    class Meta:
        model = ClientProfile
        fields = (
            'id',
            'user_email',
            'user_name',
            'user_first_name',
            'user_last_name',

            # Basic Info
            'bio',
            'profile_photo',
            'date_of_birth',
            'gender',
            'age',

            # Location
            'address',
            'location',

            # Physical Stats
            'height_inches',
            'current_weight_lbs',
            'target_weight_lbs',
            'bmi',

            # Fitness Profile
            'fitness_level',
            'primary_goal',
            'secondary_goals',

            # Health Information
            'health_conditions',
            'medications',
            'dietary_restrictions',

            # Emergency Contact
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_relationship',

            # Workout Preferences
            'preferred_workout_days',
            'preferred_workout_times',
            'sessions_per_week',
            'preferred_session_duration',
            'preferred_specializations',
            'preferred_training_style',

            # Profile Status
            'profile_complete',

            # Timestamps
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'age', 'bmi', 'created_at', 'updated_at')


class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating client profile (excludes sensitive fields from display)"""

    class Meta:
        model = ClientProfile
        fields = (
            # Basic Info
            'bio',
            'profile_photo',
            'date_of_birth',
            'gender',

            # Location
            'address',
            'location',

            # Physical Stats
            'height_inches',
            'current_weight_lbs',
            'target_weight_lbs',

            # Fitness Profile
            'fitness_level',
            'primary_goal',
            'secondary_goals',

            # Health Information
            'health_conditions',
            'medications',
            'dietary_restrictions',

            # Emergency Contact
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_relationship',

            # Workout Preferences
            'preferred_workout_days',
            'preferred_workout_times',
            'sessions_per_week',
            'preferred_session_duration',
            'preferred_specializations',
            'preferred_training_style',

            # Profile Status
            'profile_complete',
        )

    def validate(self, data):
        """Custom validation"""
        # Validate weight ranges (imperial: 44-1100 lbs is roughly 20-500 kg)
        if 'current_weight_lbs' in data and data['current_weight_lbs']:
            if data['current_weight_lbs'] < 44 or data['current_weight_lbs'] > 1100:
                raise serializers.ValidationError({
                    'current_weight_lbs': 'Weight must be between 44 and 1100 lbs'
                })

        # Validate height range (imperial: 20-118 inches is roughly 50-300 cm)
        if 'height_inches' in data and data['height_inches']:
            if data['height_inches'] < 20 or data['height_inches'] > 118:
                raise serializers.ValidationError({
                    'height_inches': 'Height must be between 20 and 118 inches'
                })

        # Validate sessions per week
        if 'sessions_per_week' in data and data['sessions_per_week']:
            if data['sessions_per_week'] < 1 or data['sessions_per_week'] > 7:
                raise serializers.ValidationError({
                    'sessions_per_week': 'Sessions per week must be between 1 and 7'
                })

        return data


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
