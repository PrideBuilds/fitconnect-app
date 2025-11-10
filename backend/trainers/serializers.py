from rest_framework import serializers
from rest_framework_gis.fields import GeometryField
from .models import Specialization, TrainerProfile, TrainerPhoto, TrainerCertification, AvailabilitySlot, BookedSlot
from .utils import geocode_address
import logging

logger = logging.getLogger(__name__)


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ('id', 'name', 'slug', 'icon', 'description')


class TrainerPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerPhoto
        fields = ('id', 'photo', 'photo_type', 'caption', 'order')


class TrainerCertificationSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = TrainerCertification
        fields = (
            'id',
            'name',
            'issuing_organization',
            'issue_date',
            'expiry_date',
            'credential_id',
            'document',
            'is_expired'
        )

    def get_is_expired(self, obj):
        return obj.is_expired()


class TrainerProfileSerializer(serializers.ModelSerializer):
    """Detailed trainer profile serializer (for trainer's own profile)"""

    user = serializers.SerializerMethodField()
    location = GeometryField()  # Returns GeoJSON format
    specializations = SpecializationSerializer(many=True, read_only=True)
    specialization_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Specialization.objects.all(),
        source='specializations'
    )
    photos = TrainerPhotoSerializer(many=True, read_only=True)
    certifications = TrainerCertificationSerializer(many=True, read_only=True)

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'user',
            'bio',
            'years_experience',
            'address',
            'location',
            'service_radius_miles',
            'hourly_rate',
            'specializations',
            'specialization_ids',
            'photos',
            'certifications',
            'verified',
            'verification_expires',
            'average_rating',
            'total_reviews',
            'slug',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'verified',
            'verification_expires',
            'average_rating',
            'total_reviews',
            'slug',
            'created_at',
            'updated_at',
        )

    def get_user(self, obj):
        """Return user information (includes email for own profile)"""
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }


class TrainerProfilePublicSerializer(serializers.ModelSerializer):
    """Public-facing trainer profile serializer (hides sensitive data like email)"""

    user = serializers.SerializerMethodField()
    location = GeometryField()  # Returns GeoJSON format
    specializations = SpecializationSerializer(many=True, read_only=True)
    photos = TrainerPhotoSerializer(many=True, read_only=True)
    certifications = TrainerCertificationSerializer(many=True, read_only=True)

    def get_user(self, obj):
        """Return user information WITHOUT email (public view)"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
        }

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'user',
            'bio',
            'years_experience',
            'address',
            'location',
            'service_radius_miles',
            'hourly_rate',
            'specializations',
            'photos',
            'certifications',
            'verified',
            'verification_expires',
            'average_rating',
            'total_reviews',
            'slug',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'verified',
            'verification_expires',
            'average_rating',
            'total_reviews',
            'slug',
            'created_at',
            'updated_at',
        )

    def create(self, validated_data):
        """Create trainer profile with automatic geocoding"""
        # Extract address for geocoding
        address = validated_data.get('address')

        # Geocode address if provided
        if address:
            location = geocode_address(address)
            if location:
                validated_data['location'] = location
                logger.info(f"Geocoded address to: {location}")
            else:
                logger.warning(f"Failed to geocode address: {address}")

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update trainer profile with automatic geocoding if address changed"""
        # Check if address changed
        new_address = validated_data.get('address')

        if new_address and new_address != instance.address:
            # Address changed - geocode it
            location = geocode_address(new_address)
            if location:
                validated_data['location'] = location
                logger.info(f"Re-geocoded address to: {location}")
            else:
                logger.warning(f"Failed to geocode new address: {new_address}")

        return super().update(instance, validated_data)


class TrainerProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search results"""

    user_name = serializers.CharField(source='user.username', read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    profile_photo = serializers.SerializerMethodField()
    distance_miles = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        required=False
    )

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'slug',
            'user_name',
            'bio',
            'years_experience',
            'hourly_rate',
            'specializations',
            'profile_photo',
            'verified',
            'average_rating',
            'total_reviews',
            'distance_miles',
        )

    def get_profile_photo(self, obj):
        """Return first profile photo URL"""
        photo = obj.photos.filter(photo_type='profile').first()
        if photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(photo.photo.url)
        return None


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    """Serializer for trainer availability slots"""

    day_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = (
            'id',
            'day_of_week',
            'day_name',
            'start_time',
            'end_time',
            'is_available',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_day_name(self, obj):
        """Return the day name (e.g., 'Monday')"""
        return dict(AvailabilitySlot.DAY_OF_WEEK_CHOICES)[obj.day_of_week]

    def validate(self, data):
        """Validate that end_time is after start_time"""
        if 'start_time' in data and 'end_time' in data:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time'
                })
        return data


class BookedSlotSerializer(serializers.ModelSerializer):
    """Serializer for booked training slots"""

    trainer_name = serializers.SerializerMethodField(read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)
    duration_minutes = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BookedSlot
        fields = (
            'id',
            'trainer',
            'trainer_name',
            'client',
            'client_name',
            'start_datetime',
            'end_datetime',
            'duration_minutes',
            'status',
            'notes',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_trainer_name(self, obj):
        """Return trainer's full name"""
        return f"{obj.trainer.user.first_name} {obj.trainer.user.last_name}"

    def get_client_name(self, obj):
        """Return client's full name"""
        return f"{obj.client.first_name} {obj.client.last_name}"

    def get_duration_minutes(self, obj):
        """Return session duration in minutes"""
        return obj.duration_minutes()

    def validate(self, data):
        """Validate booking times"""
        if 'start_datetime' in data and 'end_datetime' in data:
            if data['start_datetime'] >= data['end_datetime']:
                raise serializers.ValidationError({
                    'end_datetime': 'End time must be after start time'
                })

            # Check if booking is in the past
            from django.utils import timezone
            if data['start_datetime'] < timezone.now():
                raise serializers.ValidationError({
                    'start_datetime': 'Cannot book slots in the past'
                })

        return data
