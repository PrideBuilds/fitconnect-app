"""
Tests for double-booking prevention in the booking system.

These tests verify that the pessimistic locking and conflict detection
prevent race conditions and overlapping bookings for the same trainer.
"""

import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.exceptions import ValidationError
from bookings.models import Booking
from bookings.serializers import BookingCreateSerializer
from trainers.models import TrainerProfile, Specialization
from users.models import User

User = get_user_model()


@pytest.fixture
def trainer_user(db):
    """Create a trainer user"""
    return User.objects.create_user(
        username='trainer',
        email='trainer@example.com',
        password='testpass123',
        role='trainer',
        first_name='John',
        last_name='Trainer',
        email_verified=True
    )


@pytest.fixture
def client_user(db):
    """Create a client user"""
    return User.objects.create_user(
        username='client',
        email='client@example.com',
        password='testpass123',
        role='client',
        first_name='Jane',
        last_name='Client',
        email_verified=True
    )


@pytest.fixture
def trainer_profile(db, trainer_user):
    """Create a trainer profile"""
    from django.contrib.gis.geos import Point

    return TrainerProfile.objects.create(
        user=trainer_user,
        bio='Experienced trainer',
        hourly_rate=Decimal('75.00'),
        service_radius_miles=10,
        location=Point(-122.4194, 37.7749),  # San Francisco
        published=True
    )


@pytest.mark.django_db
class TestDoubleBookingPrevention:
    """Test suite for double-booking prevention"""

    def test_booking_creation_without_conflict(self, trainer_profile, client_user):
        """Test that a booking can be created when there's no conflict"""
        booking_data = {
            'trainer': trainer_profile.id,  # Pass ID, not object
            'session_date': date.today() + timedelta(days=1),
            'start_time': time(10, 0),
            'end_time': time(11, 0),
            'duration_minutes': 60,
            'location_address': '123 Main St',
            'client_notes': 'Focus on strength training',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        booking = serializer.save(client=client_user)

        assert booking.id is not None
        assert booking.trainer == trainer_profile
        assert booking.client == client_user
        assert booking.status == 'pending'

    def test_exact_time_overlap_prevented(self, trainer_profile, client_user):
        """Test that exact time overlap is prevented"""
        session_date = date.today() + timedelta(days=1)

        # Create first booking
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Try to create second booking with exact same time
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': session_date,
            'start_time': time(10, 0),
            'end_time': time(11, 0),
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        with pytest.raises(ValidationError) as exc_info:
            serializer.save(client=client_user)

        assert 'already booked' in str(exc_info.value).lower()

    def test_partial_overlap_start_prevented(self, trainer_profile, client_user):
        """Test that overlap where new booking starts during existing is prevented"""
        session_date = date.today() + timedelta(days=1)

        # Create first booking: 10:00 - 11:00
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='pending'
        )

        # Try to create booking: 10:30 - 11:30 (starts during existing)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': session_date,
            'start_time': time(10, 30),
            'end_time': time(11, 30),
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        with pytest.raises(ValidationError):
            serializer.save(client=client_user)

    def test_partial_overlap_end_prevented(self, trainer_profile, client_user):
        """Test that overlap where new booking ends during existing is prevented"""
        session_date = date.today() + timedelta(days=1)

        # Create first booking: 11:00 - 12:00
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(11, 0),
            end_time=time(12, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Try to create booking: 10:30 - 11:30 (ends during existing)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': session_date,
            'start_time': time(10, 30),
            'end_time': time(11, 30),
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        with pytest.raises(ValidationError):
            serializer.save(client=client_user)

    def test_complete_overlap_prevented(self, trainer_profile, client_user):
        """Test that new booking completely containing existing is prevented"""
        session_date = date.today() + timedelta(days=1)

        # Create first booking: 10:30 - 11:30
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(10, 30),
            end_time=time(11, 30),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='pending'
        )

        # Try to create booking: 10:00 - 12:00 (completely contains existing)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': session_date,
            'start_time': time(10, 0),
            'end_time': time(12, 0),
            'duration_minutes': 120,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        with pytest.raises(ValidationError):
            serializer.save(client=client_user)

    def test_adjacent_bookings_allowed(self, trainer_profile, client_user):
        """Test that adjacent bookings (no overlap) are allowed"""
        session_date = date.today() + timedelta(days=1)

        # Create first booking: 10:00 - 11:00
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Create second booking: 11:00 - 12:00 (starts when first ends)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': session_date,
            'start_time': time(11, 0),
            'end_time': time(12, 0),
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        # Should succeed - no overlap
        booking = serializer.save(client=client_user)
        assert booking.id is not None

    def test_cancelled_bookings_dont_conflict(self, trainer_profile, client_user):
        """Test that cancelled bookings don't prevent new bookings"""
        session_date = date.today() + timedelta(days=1)

        # Create cancelled booking
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='cancelled_by_client'
        )

        # Try to create new booking at same time (should succeed)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': session_date,
            'start_time': time(10, 0),
            'end_time': time(11, 0),
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        booking = serializer.save(client=client_user)
        assert booking.id is not None

    def test_different_dates_no_conflict(self, trainer_profile, client_user):
        """Test that bookings on different dates don't conflict"""
        # Create booking on day 1
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Create booking on day 2 at same time (should succeed)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': date.today() + timedelta(days=2),
            'start_time': time(10, 0),
            'end_time': time(11, 0),
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }

        serializer = BookingCreateSerializer(data=booking_data)
        assert serializer.is_valid(), serializer.errors

        booking = serializer.save(client=client_user)
        assert booking.id is not None

    def test_conflict_check_method_directly(self, trainer_profile, client_user):
        """Test the check_booking_conflict method directly"""
        session_date = date.today() + timedelta(days=1)

        # Create existing booking
        existing = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=session_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            status='pending'
        )

        # Check for conflict (should find existing booking)
        with transaction.atomic():
            conflict = Booking.check_booking_conflict(
                trainer=trainer_profile,
                session_date=session_date,
                start_time=time(10, 30),
                end_time=time(11, 30)
            )
            assert conflict == existing

        # Check for no conflict
        with transaction.atomic():
            no_conflict = Booking.check_booking_conflict(
                trainer=trainer_profile,
                session_date=session_date,
                start_time=time(11, 0),
                end_time=time(12, 0)
            )
            assert no_conflict is None
