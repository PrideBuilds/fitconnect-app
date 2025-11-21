from rest_framework import serializers
from .models import Booking, Review
from trainers.models import TrainerProfile
from users.models import ClientProfile
from django.utils import timezone
from django.db import transaction


class TrainerBasicSerializer(serializers.ModelSerializer):
    """Nested trainer data for bookings"""
    user = serializers.SerializerMethodField()

    class Meta:
        model = TrainerProfile
        fields = ('id', 'user', 'hourly_rate', 'address', 'service_radius_miles')

    def get_user(self, obj):
        """Return user data"""
        return {
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
        }


class ClientBasicSerializer(serializers.Serializer):
    """Nested client data for bookings including fitness profile"""

    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    fitness_profile = serializers.SerializerMethodField()

    def get_fitness_profile(self, obj):
        """Return client's fitness profile if it exists"""
        try:
            profile = ClientProfile.objects.get(user=obj)
            return {
                'fitness_level': profile.fitness_level,
                'primary_goal': profile.primary_goal,
                'secondary_goals': profile.secondary_goals,
                'height_inches': float(profile.height_inches) if profile.height_inches else None,
                'current_weight_lbs': float(profile.current_weight_lbs) if profile.current_weight_lbs else None,
                'target_weight_lbs': float(profile.target_weight_lbs) if profile.target_weight_lbs else None,
                'health_conditions': profile.health_conditions,
                'medications': profile.medications,
                'dietary_restrictions': profile.dietary_restrictions,
                'emergency_contact_name': profile.emergency_contact_name,
                'emergency_contact_phone': profile.emergency_contact_phone,
                'emergency_contact_relationship': profile.emergency_contact_relationship,
                'preferred_workout_days': profile.preferred_workout_days,
                'preferred_workout_times': profile.preferred_workout_times,
                'sessions_per_week': profile.sessions_per_week,
                'preferred_session_duration': profile.preferred_session_duration,
                'preferred_training_style': profile.preferred_training_style,
                'age': profile.age,
                'bmi': profile.bmi,
                'bio': profile.bio,
            }
        except ClientProfile.DoesNotExist:
            return None


class BookingSerializer(serializers.ModelSerializer):
    """Full booking serializer with all details"""

    trainer = TrainerBasicSerializer(read_only=True)
    trainer_name = serializers.SerializerMethodField(read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)
    can_cancel = serializers.SerializerMethodField(read_only=True)
    is_upcoming = serializers.SerializerMethodField(read_only=True)
    is_past = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id',
            'trainer',
            'trainer_name',
            'client',
            'client_name',
            'session_date',
            'start_time',
            'end_time',
            'duration_minutes',
            'location_address',
            'hourly_rate',
            'total_price',
            'status',
            'payment_status',
            'client_notes',
            'trainer_notes',
            'cancellation_reason',
            'cancelled_at',
            'can_cancel',
            'is_upcoming',
            'is_past',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'total_price',
            'created_at',
            'updated_at',
            'cancelled_at',
        )

    def get_trainer_name(self, obj):
        """Return trainer's full name"""
        return f"{obj.trainer.user.first_name} {obj.trainer.user.last_name}"

    def get_client_name(self, obj):
        """Return client's full name"""
        return f"{obj.client.first_name} {obj.client.last_name}"

    def get_can_cancel(self, obj):
        """Check if booking can be cancelled"""
        return obj.can_cancel()

    def get_is_upcoming(self, obj):
        """Check if booking is upcoming"""
        return obj.is_upcoming()

    def get_is_past(self, obj):
        """Check if booking is in the past"""
        return obj.is_past()

    def validate(self, data):
        """Custom validation"""
        # Validate session date is not in the past
        if 'session_date' in data and data['session_date'] < timezone.now().date():
            raise serializers.ValidationError({
                'session_date': 'Cannot book sessions in the past'
            })

        # Validate times
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time'
                })

        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating bookings"""

    class Meta:
        model = Booking
        fields = (
            'trainer',
            'session_date',
            'start_time',
            'end_time',
            'duration_minutes',
            'location_address',
            'client_notes',
        )

    def validate(self, data):
        """Validate booking creation"""
        # Validate session date is not in the past
        if data['session_date'] < timezone.now().date():
            raise serializers.ValidationError({
                'session_date': 'Cannot book sessions in the past'
            })

        # Validate times
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time'
            })

        # Validate trainer exists and is published
        try:
            trainer = TrainerProfile.objects.get(id=data['trainer'].id, published=True)
        except TrainerProfile.DoesNotExist:
            raise serializers.ValidationError({
                'trainer': 'Trainer not found or not available'
            })

        # Auto-populate hourly rate from trainer
        data['hourly_rate'] = trainer.hourly_rate

        return data

    def create(self, validated_data):
        """
        Create booking with auto-calculated price.
        Uses atomic transaction and pessimistic locking to prevent double-booking.
        """
        # Wrap in atomic transaction to ensure data consistency
        with transaction.atomic():
            # Check for booking conflicts using pessimistic locking
            conflict = Booking.check_booking_conflict(
                trainer=validated_data['trainer'],
                session_date=validated_data['session_date'],
                start_time=validated_data['start_time'],
                end_time=validated_data['end_time']
            )

            if conflict:
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f'This time slot is already booked. '
                        f'Conflict with existing booking from '
                        f'{conflict.start_time.strftime("%H:%M")} to '
                        f'{conflict.end_time.strftime("%H:%M")}.'
                    ]
                })

            # Create the booking (client is set from request.user in the view)
            booking = Booking.objects.create(**validated_data)
            return booking


class BookingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing bookings"""

    trainer = TrainerBasicSerializer(read_only=True)
    trainer_name = serializers.SerializerMethodField()
    client = ClientBasicSerializer(read_only=True)
    client_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id',
            'trainer',
            'trainer_name',
            'client',
            'client_name',
            'session_date',
            'start_time',
            'end_time',
            'duration_minutes',
            'location_address',
            'hourly_rate',
            'total_price',
            'status',
            'status_display',
            'payment_status',
            'client_notes',
            'trainer_notes',
            'created_at',
        )

    def get_trainer_name(self, obj):
        return f"{obj.trainer.user.first_name} {obj.trainer.user.last_name}"

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for viewing reviews"""
    client_name = serializers.SerializerMethodField()
    client_username = serializers.CharField(source='client.username', read_only=True)
    trainer_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            'id',
            'booking',
            'trainer',
            'client',
            'client_name',
            'client_username',
            'trainer_name',
            'rating',
            'comment',
            'is_verified',
            'is_visible',
            'created_at',
            'updated_at',
            'can_edit',
        )
        read_only_fields = ('id', 'client', 'trainer', 'is_verified', 'created_at', 'updated_at')

    def get_client_name(self, obj):
        """Get client's display name"""
        if obj.client.first_name and obj.client.last_name:
            return f"{obj.client.first_name} {obj.client.last_name}"
        return obj.client.username

    def get_trainer_name(self, obj):
        """Get trainer's display name"""
        if obj.trainer.user.first_name and obj.trainer.user.last_name:
            return f"{obj.trainer.user.first_name} {obj.trainer.user.last_name}"
        return obj.trainer.user.username

    def get_can_edit(self, obj):
        """Check if current user can edit this review"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.client == request.user


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating reviews"""

    class Meta:
        model = Review
        fields = ('booking', 'rating', 'comment')

    def validate_booking(self, booking):
        """Validate that booking can be reviewed"""
        # Check if booking is completed
        if booking.status != 'completed':
            raise serializers.ValidationError("Can only review completed sessions")

        # Check if user is the client who made the booking
        request = self.context.get('request')
        if booking.client != request.user:
            raise serializers.ValidationError("Can only review your own bookings")

        # Check if review already exists (for create only)
        if self.instance is None:  # Creating new review
            if hasattr(booking, 'review'):
                raise serializers.ValidationError("This booking has already been reviewed")

        return booking

    def validate_rating(self, rating):
        """Validate rating is 1-5"""
        if rating < 1 or rating > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return rating

    def create(self, validated_data):
        """Create review and auto-set client and trainer"""
        booking = validated_data['booking']
        validated_data['client'] = booking.client
        validated_data['trainer'] = booking.trainer
        return super().create(validated_data)
