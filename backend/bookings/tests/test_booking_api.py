"""
Tests for Booking API endpoints.

Tests cover:
- Booking list and creation
- Booking detail, update, and cancellation
- Booking actions (confirm, complete, no_show)
- Role-based permissions
"""

import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.test import APIClient
from bookings.models import Booking
from trainers.models import TrainerProfile
from users.models import User


@pytest.fixture
def api_client():
    """API client for making requests"""
    return APIClient()


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
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='testpass123',
        role='admin',
        first_name='Admin',
        last_name='User',
        email_verified=True
    )


@pytest.fixture
def trainer_profile(db, trainer_user):
    """Create a trainer profile"""
    return TrainerProfile.objects.create(
        user=trainer_user,
        bio='Experienced trainer',
        hourly_rate=Decimal('75.00'),
        service_radius_miles=10,
        location=Point(-122.4194, 37.7749),  # San Francisco
        published=True
    )


@pytest.fixture
def sample_booking(db, trainer_profile, client_user):
    """Create a sample booking"""
    return Booking.objects.create(
        trainer=trainer_profile,
        client=client_user,
        session_date=date.today() + timedelta(days=7),
        start_time=time(10, 0),
        end_time=time(11, 0),
        duration_minutes=60,
        location_address='123 Main St, San Francisco',
        hourly_rate=Decimal('75.00'),
        total_price=Decimal('75.00'),
        status='pending'
    )


@pytest.mark.django_db
class TestBookingListCreateView:
    """Test booking list and creation endpoints"""

    def test_list_bookings_requires_authentication(self, api_client):
        """Test that listing bookings requires authentication"""
        response = api_client.get('/api/v1/bookings/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_client_can_list_own_bookings(self, api_client, client_user, sample_booking):
        """Test that clients can list their own bookings"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/bookings/')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == sample_booking.id

    def test_trainer_can_list_own_bookings(self, api_client, trainer_user, trainer_profile, sample_booking):
        """Test that trainers can list bookings for their profile"""
        api_client.force_authenticate(user=trainer_user)
        response = api_client.get('/api/v1/bookings/')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == sample_booking.id

    def test_trainer_without_profile_gets_404(self, api_client, db):
        """Test that trainer without profile gets 404"""
        trainer_no_profile = User.objects.create_user(
            username='trainer2',
            email='trainer2@example.com',
            password='testpass123',
            role='trainer',
            email_verified=True
        )
        api_client.force_authenticate(user=trainer_no_profile)
        response = api_client.get('/api/v1/bookings/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'Trainer profile not found' in str(response.data)

    def test_filter_bookings_by_status(self, api_client, client_user, trainer_profile):
        """Test filtering bookings by status"""
        # Create bookings with different statuses
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='pending'
        )
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() + timedelta(days=2),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='confirmed'
        )

        api_client.force_authenticate(user=client_user)

        # Filter for confirmed bookings
        response = api_client.get('/api/v1/bookings/?status=confirmed')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == 'confirmed'

    def test_create_booking_requires_authentication(self, api_client, trainer_profile):
        """Test that creating booking requires authentication"""
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': str(date.today() + timedelta(days=7)),
            'start_time': '10:00',
            'end_time': '11:00',
            'duration_minutes': 60,
            'location_address': '123 Main St',
        }
        response = api_client.post('/api/v1/bookings/', booking_data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_client_can_create_booking(self, api_client, client_user, trainer_profile):
        """Test that clients can create bookings"""
        api_client.force_authenticate(user=client_user)

        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': str(date.today() + timedelta(days=7)),
            'start_time': '10:00:00',
            'end_time': '11:00:00',
            'duration_minutes': 60,
            'location_address': '123 Main St, San Francisco',
            'client_notes': 'Focus on strength training'
        }
        response = api_client.post('/api/v1/bookings/', booking_data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['client'] == client_user.id  # client is just an ID
        assert response.data['trainer']['id'] == trainer_profile.id
        assert response.data['status'] == 'pending'
        assert response.data['total_price'] == '75.00'

    def test_trainer_cannot_create_booking(self, api_client, trainer_user, trainer_profile):
        """Test that trainers cannot create bookings"""
        api_client.force_authenticate(user=trainer_user)

        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': str(date.today() + timedelta(days=7)),
            'start_time': '10:00:00',
            'end_time': '11:00:00',
            'duration_minutes': 60,
            'location_address': '123 Main St',
        }
        response = api_client.post('/api/v1/bookings/', booking_data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Only clients can create bookings' in str(response.data)

    def test_create_booking_validation_past_date(self, api_client, client_user, trainer_profile):
        """Test that bookings cannot be created for past dates"""
        api_client.force_authenticate(user=client_user)

        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': str(date.today() - timedelta(days=1)),
            'start_time': '10:00:00',
            'end_time': '11:00:00',
            'duration_minutes': 60,
            'location_address': '123 Main St',
        }
        response = api_client.post('/api/v1/bookings/', booking_data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_booking_prevents_double_booking(self, api_client, client_user, trainer_profile):
        """Test that double bookings are prevented"""
        session_date = date.today() + timedelta(days=7)

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
            total_price=Decimal('75.00'),
            status='confirmed'
        )

        api_client.force_authenticate(user=client_user)

        # Try to create overlapping booking
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': str(session_date),
            'start_time': '10:30:00',
            'end_time': '11:30:00',
            'duration_minutes': 60,
            'location_address': '456 Oak Ave',
        }
        response = api_client.post('/api/v1/bookings/', booking_data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already booked' in str(response.data).lower()


@pytest.mark.django_db
class TestBookingDetailView:
    """Test booking detail, update, and cancellation endpoints"""

    def test_get_booking_requires_authentication(self, api_client, sample_booking):
        """Test that getting booking details requires authentication"""
        response = api_client.get(f'/api/v1/bookings/{sample_booking.id}/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_client_can_get_own_booking(self, api_client, client_user, sample_booking):
        """Test that clients can get their own booking details"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get(f'/api/v1/bookings/{sample_booking.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == sample_booking.id
        assert response.data['client'] == client_user.id  # client is just an ID

    def test_trainer_can_get_own_booking(self, api_client, trainer_user, sample_booking):
        """Test that trainers can get bookings for their profile"""
        api_client.force_authenticate(user=trainer_user)
        response = api_client.get(f'/api/v1/bookings/{sample_booking.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == sample_booking.id

    def test_other_user_cannot_access_booking(self, api_client, db, sample_booking):
        """Test that other users cannot access someone else's booking"""
        other_client = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123',
            role='client',
            email_verified=True
        )
        api_client.force_authenticate(user=other_client)
        response = api_client.get(f'/api/v1/bookings/{sample_booking.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_trainer_can_confirm_booking(self, api_client, trainer_user, sample_booking):
        """Test that trainers can confirm bookings"""
        api_client.force_authenticate(user=trainer_user)

        response = api_client.patch(
            f'/api/v1/bookings/{sample_booking.id}/',
            {'action': 'confirm'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'confirmed'

        # Verify in database
        sample_booking.refresh_from_db()
        assert sample_booking.status == 'confirmed'

    def test_trainer_can_complete_booking(self, api_client, trainer_user, client_user, trainer_profile):
        """Test that trainers can mark bookings as completed"""
        # Create a past confirmed booking
        past_booking = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() - timedelta(days=1),  # Yesterday
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='confirmed'
        )

        api_client.force_authenticate(user=trainer_user)

        response = api_client.patch(
            f'/api/v1/bookings/{past_booking.id}/',
            {'action': 'complete'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'completed'

    def test_trainer_can_mark_no_show(self, api_client, trainer_user, client_user, trainer_profile):
        """Test that trainers can mark bookings as no-show"""
        # Create a past confirmed booking
        past_booking = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() - timedelta(days=1),  # Yesterday
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='confirmed'
        )

        api_client.force_authenticate(user=trainer_user)

        response = api_client.patch(
            f'/api/v1/bookings/{past_booking.id}/',
            {'action': 'no_show'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'no_show'

    def test_client_cannot_confirm_booking(self, api_client, client_user, sample_booking):
        """Test that clients cannot confirm bookings"""
        api_client.force_authenticate(user=client_user)

        response = api_client.patch(
            f'/api/v1/bookings/{sample_booking.id}/',
            {'action': 'confirm'},
            format='json'
        )

        # Action is ignored, status stays pending
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'pending'

    def test_trainer_can_update_notes(self, api_client, trainer_user, sample_booking):
        """Test that trainers can update trainer notes"""
        api_client.force_authenticate(user=trainer_user)

        response = api_client.patch(
            f'/api/v1/bookings/{sample_booking.id}/',
            {'trainer_notes': 'Client showed great form'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        sample_booking.refresh_from_db()
        assert sample_booking.trainer_notes == 'Client showed great form'

    def test_client_can_update_notes(self, api_client, client_user, sample_booking):
        """Test that clients can update client notes"""
        api_client.force_authenticate(user=client_user)

        response = api_client.patch(
            f'/api/v1/bookings/{sample_booking.id}/',
            {'client_notes': 'Focus on upper body'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        sample_booking.refresh_from_db()
        assert sample_booking.client_notes == 'Focus on upper body'

    def test_client_can_cancel_booking(self, api_client, client_user, sample_booking):
        """Test that clients can cancel their bookings"""
        api_client.force_authenticate(user=client_user)

        response = api_client.delete(
            f'/api/v1/bookings/{sample_booking.id}/',
            {'reason': 'Schedule conflict'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'cancelled_by_client'
        assert response.data['cancellation_reason'] == 'Schedule conflict'

    def test_trainer_can_cancel_booking(self, api_client, trainer_user, sample_booking):
        """Test that trainers can cancel bookings"""
        api_client.force_authenticate(user=trainer_user)

        response = api_client.delete(
            f'/api/v1/bookings/{sample_booking.id}/',
            {'reason': 'Personal emergency'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'cancelled_by_trainer'
        assert response.data['cancellation_reason'] == 'Personal emergency'

    def test_cannot_cancel_booking_less_than_24_hours(self, api_client, client_user, trainer_profile):
        """Test that bookings cannot be cancelled less than 24 hours before session"""
        # Create booking for tomorrow (less than 24 hours)
        tomorrow_booking = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='confirmed'
        )

        api_client.force_authenticate(user=client_user)

        response = api_client.delete(
            f'/api/v1/bookings/{tomorrow_booking.id}/',
            format='json'
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot be cancelled' in str(response.data).lower()
