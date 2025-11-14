from rest_framework import serializers
from .models import Booking
from trainers.models import TrainerProfile
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
            'client_notes',
            'trainer_notes',
            'created_at',
        )

    def get_trainer_name(self, obj):
        return f"{obj.trainer.user.first_name} {obj.trainer.user.last_name}"

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"
