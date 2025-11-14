"""
Tests for Admin API endpoints.

Tests cover:
- Dashboard statistics
- User management
- Trainer approval
- Booking oversight
- Review moderation
- CSV exports
"""

import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.test import APIClient
from bookings.models import Booking, Review
from trainers.models import TrainerProfile
from users.models import User
import csv
from io import StringIO


@pytest.fixture
def api_client():
    """API client for making requests"""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    return User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        role='admin',
        first_name='Admin',
        last_name='User',
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
def trainer_profile(db, trainer_user):
    """Create a trainer profile"""
    return TrainerProfile.objects.create(
        user=trainer_user,
        bio='Experienced trainer',
        hourly_rate=Decimal('75.00'),
        service_radius_miles=10,
        location=Point(-122.4194, 37.7749),
        published=True,
        verified=True
    )


@pytest.fixture
def pending_trainer_profile(db):
    """Create a pending trainer profile (not verified)"""
    pending_trainer = User.objects.create_user(
        username='pending_trainer',
        email='pending@example.com',
        password='testpass123',
        role='trainer',
        first_name='Pending',
        last_name='Trainer',
        email_verified=True
    )
    return TrainerProfile.objects.create(
        user=pending_trainer,
        bio='Pending trainer',
        hourly_rate=Decimal('60.00'),
        service_radius_miles=5,
        location=Point(-122.4194, 37.7749),
        published=False,
        verified=False
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
        location_address='123 Main St',
        hourly_rate=Decimal('75.00'),
        total_price=Decimal('75.00'),
        status='pending'
    )


@pytest.fixture
def sample_review(db, trainer_profile, client_user):
    """Create a sample review"""
    completed_booking = Booking.objects.create(
        trainer=trainer_profile,
        client=client_user,
        session_date=date.today() - timedelta(days=1),
        start_time=time(10, 0),
        end_time=time(11, 0),
        duration_minutes=60,
        location_address='123 Main St',
        hourly_rate=Decimal('75.00'),
        total_price=Decimal('75.00'),
        status='completed'
    )
    return Review.objects.create(
        trainer=trainer_profile,
        client=client_user,
        booking=completed_booking,
        rating=5,
        comment='Great session!',
        is_verified=True,
        is_visible=True
    )


@pytest.mark.django_db
class TestAdminDashboardStats:
    """Test admin dashboard statistics endpoint"""

    def test_stats_requires_authentication(self, api_client):
        """Test that dashboard stats requires authentication"""
        response = api_client.get('/api/v1/admin/stats/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_stats_requires_admin_role(self, api_client, client_user):
        """Test that only admins can access dashboard stats"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/stats/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_get_dashboard_stats(self, api_client, admin_user, client_user, trainer_user,
                                           trainer_profile, sample_booking, sample_review):
        """Test that admin can get dashboard statistics"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/stats/')

        assert response.status_code == status.HTTP_200_OK

        # Dashboard stats returns nested structure
        assert 'users' in response.data
        assert 'trainers' in response.data
        assert 'bookings' in response.data
        assert 'reviews' in response.data
        assert 'revenue' in response.data


@pytest.mark.django_db
class TestAdminUserManagement:
    """Test admin user management endpoints"""

    def test_list_users_requires_admin(self, api_client, client_user):
        """Test that listing users requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_users(self, api_client, admin_user, client_user, trainer_user):
        """Test that admin can list all users"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/users/')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 3  # admin, client, trainer

    def test_filter_users_by_role(self, api_client, admin_user, client_user, trainer_user):
        """Test filtering users by role"""
        api_client.force_authenticate(user=admin_user)

        # Filter for clients
        response = api_client.get('/api/v1/admin/users/?role=client')
        assert response.status_code == status.HTTP_200_OK
        for user in response.data['results']:
            assert user['role'] == 'client'

        # Filter for trainers
        response = api_client.get('/api/v1/admin/users/?role=trainer')
        assert response.status_code == status.HTTP_200_OK
        for user in response.data['results']:
            assert user['role'] == 'trainer'

    def test_search_users_by_email(self, api_client, admin_user, client_user):
        """Test searching users by email"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/v1/admin/users/?search={client_user.email}')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        # Should find the client user
        emails = [u['email'] for u in response.data['results']]
        assert client_user.email in emails

    def test_get_user_detail_requires_admin(self, api_client, client_user, trainer_user):
        """Test that getting user details requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get(f'/api/v1/admin/users/{trainer_user.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_get_user_detail(self, api_client, admin_user, client_user):
        """Test that admin can get user details"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/v1/admin/users/{client_user.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == client_user.id
        assert response.data['email'] == client_user.email
        assert response.data['role'] == 'client'

    def test_get_nonexistent_user_returns_404(self, api_client, admin_user):
        """Test that requesting nonexistent user returns 404"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/users/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_user_detail_includes_booking_count(self, api_client, admin_user, client_user,
                                                 trainer_profile, sample_booking):
        """Test that user detail includes booking statistics"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/v1/admin/users/{client_user.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert 'bookings_count' in response.data  # Actual field name is bookings_count
        assert response.data['bookings_count'] >= 1


@pytest.mark.django_db
class TestAdminTrainerApproval:
    """Test admin trainer approval endpoints"""

    def test_list_trainers_requires_admin(self, api_client, client_user):
        """Test that listing trainers requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/trainers/1/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_get_trainer_detail(self, api_client, admin_user, trainer_profile):
        """Test that admin can get trainer profile details"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/v1/admin/trainers/{trainer_profile.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == trainer_profile.id
        assert 'user' in response.data
        assert 'verified' in response.data

    def test_admin_can_approve_trainer(self, api_client, admin_user, pending_trainer_profile):
        """Test that admin can verify/approve pending trainers"""
        api_client.force_authenticate(user=admin_user)

        # Verify trainer is not published initially
        assert pending_trainer_profile.published is False

        response = api_client.patch(
            f'/api/v1/admin/trainers/{pending_trainer_profile.id}/approve/',
            {'action': 'approve'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['trainer']['published'] is True

        # Verify in database
        pending_trainer_profile.refresh_from_db()
        assert pending_trainer_profile.published is True

    def test_admin_can_reject_trainer(self, api_client, admin_user, pending_trainer_profile):
        """Test that admin can reject trainer applications"""
        api_client.force_authenticate(user=admin_user)

        response = api_client.patch(
            f'/api/v1/admin/trainers/{pending_trainer_profile.id}/approve/',
            {'action': 'reject'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['trainer']['published'] is False

    def test_non_admin_cannot_approve_trainer(self, api_client, client_user, pending_trainer_profile):
        """Test that non-admins cannot approve trainers"""
        api_client.force_authenticate(user=client_user)

        response = api_client.patch(
            f'/api/v1/admin/trainers/{pending_trainer_profile.id}/approve/',
            {'action': 'approve'},
            format='json'
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminBookingManagement:
    """Test admin booking management endpoints"""

    def test_list_bookings_requires_admin(self, api_client, client_user):
        """Test that listing all bookings requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/bookings/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_all_bookings(self, api_client, admin_user, sample_booking):
        """Test that admin can list all bookings"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/bookings/')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 1

    def test_filter_bookings_by_status(self, api_client, admin_user, trainer_profile, client_user):
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

        api_client.force_authenticate(user=admin_user)

        # Filter for confirmed
        response = api_client.get('/api/v1/admin/bookings/?status=confirmed')
        assert response.status_code == status.HTTP_200_OK
        for booking in response.data['results']:
            assert booking['status'] == 'confirmed'

    def test_admin_can_get_booking_detail(self, api_client, admin_user, sample_booking):
        """Test that admin can get any booking details"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/v1/admin/bookings/{sample_booking.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == sample_booking.id

    def test_admin_can_cancel_booking(self, api_client, admin_user, sample_booking):
        """Test that admin can cancel any booking"""
        api_client.force_authenticate(user=admin_user)

        response = api_client.patch(
            f'/api/v1/admin/bookings/{sample_booking.id}/cancel/',
            {'reason': 'Admin cancellation for policy violation'},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert 'cancelled' in response.data['booking']['status']

        # Verify in database
        sample_booking.refresh_from_db()
        assert 'cancelled' in sample_booking.status


@pytest.mark.django_db
class TestAdminReviewModeration:
    """Test admin review moderation endpoints"""

    def test_list_reviews_requires_admin(self, api_client, client_user):
        """Test that listing all reviews requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/reviews/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_all_reviews(self, api_client, admin_user, sample_review):
        """Test that admin can list all reviews"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data
        assert len(response.data['results']) >= 1

    def test_filter_reviews_by_visibility(self, api_client, admin_user, trainer_profile, client_user):
        """Test filtering reviews by visibility"""
        # Create visible and hidden reviews
        completed_booking1 = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() - timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='completed'
        )
        Review.objects.create(
            trainer=trainer_profile,
            client=client_user,
            booking=completed_booking1,
            rating=5,
            comment='Visible review',
            is_visible=True
        )

        completed_booking2 = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user,
            session_date=date.today() - timedelta(days=2),
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='123 Main St',
            hourly_rate=Decimal('75.00'),
            total_price=Decimal('75.00'),
            status='completed'
        )
        Review.objects.create(
            trainer=trainer_profile,
            client=client_user,
            booking=completed_booking2,
            rating=1,
            comment='Hidden review',
            is_visible=False
        )

        api_client.force_authenticate(user=admin_user)

        # Filter for hidden
        response = api_client.get('/api/v1/admin/reviews/?visibility=hidden')
        assert response.status_code == status.HTTP_200_OK
        for review in response.data['results']:
            assert review['is_visible'] is False

    def test_admin_can_toggle_review_visibility(self, api_client, admin_user, sample_review):
        """Test that admin can hide/show reviews"""
        api_client.force_authenticate(user=admin_user)

        # Hide the review
        response = api_client.patch(
            f'/api/v1/admin/reviews/{sample_review.id}/',
            {'is_visible': False},
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['review']['is_visible'] is False

        # Verify in database
        sample_review.refresh_from_db()
        assert sample_review.is_visible is False

    def test_admin_can_mark_review_as_spam(self, api_client, admin_user, sample_review):
        """Test that admin can mark reviews as spam"""
        api_client.force_authenticate(user=admin_user)

        response = api_client.patch(
            f'/api/v1/admin/reviews/{sample_review.id}/spam/',
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['review']['is_visible'] is False

        # Verify review is hidden
        sample_review.refresh_from_db()
        assert sample_review.is_visible is False


@pytest.mark.django_db
class TestAdminCSVExports:
    """Test admin CSV export endpoints"""

    def test_export_users_requires_admin(self, api_client, client_user):
        """Test that exporting users requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/export/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_export_users_csv(self, api_client, admin_user, client_user, trainer_user):
        """Test that admin can export users to CSV"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/export/users/')

        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert 'Content-Disposition' in response
        assert 'users_export' in response['Content-Disposition']

        # Parse CSV content
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(StringIO(content))
        rows = list(csv_reader)

        # Should have at least 3 users
        assert len(rows) >= 3

        # Check CSV headers
        assert 'id' in rows[0]
        assert 'email' in rows[0]
        assert 'role' in rows[0]

    def test_export_bookings_requires_admin(self, api_client, client_user):
        """Test that exporting bookings requires admin role"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/admin/export/bookings/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_export_bookings_csv(self, api_client, admin_user, sample_booking):
        """Test that admin can export bookings to CSV"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/v1/admin/export/bookings/')

        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert 'Content-Disposition' in response
        assert 'bookings_export' in response['Content-Disposition']

        # Parse CSV content
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(StringIO(content))
        rows = list(csv_reader)

        # Should have at least 1 booking
        assert len(rows) >= 1

        # Check CSV headers
        assert 'id' in rows[0]
        assert 'status' in rows[0]
        assert 'total_price' in rows[0]
