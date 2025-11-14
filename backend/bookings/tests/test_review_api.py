"""
Tests for Review API endpoints.

Tests cover:
- Review creation by clients
- Review listing and filtering
- Review update and deletion
- Trainer review views
- Permissions and validation
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
def other_client_user(db):
    """Create another client user"""
    return User.objects.create_user(
        username='client2',
        email='client2@example.com',
        password='testpass123',
        role='client',
        first_name='John',
        last_name='Smith',
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
        location=Point(-122.4194, 37.7749),  # San Francisco
        published=True
    )


@pytest.fixture
def completed_booking(db, trainer_profile, client_user):
    """Create a completed booking eligible for review"""
    return Booking.objects.create(
        trainer=trainer_profile,
        client=client_user,
        session_date=date.today() - timedelta(days=1),  # Yesterday
        start_time=time(10, 0),
        end_time=time(11, 0),
        duration_minutes=60,
        location_address='123 Main St',
        hourly_rate=Decimal('75.00'),
        total_price=Decimal('75.00'),
        status='completed'
    )


@pytest.fixture
def sample_review(db, trainer_profile, client_user, completed_booking):
    """Create a sample review"""
    return Review.objects.create(
        trainer=trainer_profile,
        client=client_user,
        booking=completed_booking,
        rating=5,
        comment='Excellent trainer! Very knowledgeable.',
        is_verified=True,
        is_visible=True
    )


@pytest.mark.django_db
class TestReviewListCreateView:
    """Test review listing and creation endpoints"""

    def test_list_reviews_requires_authentication(self, api_client):
        """Test that listing reviews requires authentication"""
        response = api_client.get('/api/v1/bookings/reviews/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_reviews_shows_only_visible(self, api_client, trainer_user, trainer_profile, client_user):
        """Test that public review list shows only visible reviews"""
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

        # Create visible review
        Review.objects.create(
            trainer=trainer_profile,
            client=client_user,
            booking=completed_booking,
            rating=5,
            comment='Great trainer!',
            is_visible=True
        )

        # Create hidden review
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

        api_client.force_authenticate(user=trainer_user)
        response = api_client.get('/api/v1/bookings/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['is_visible'] is True

    def test_filter_reviews_by_trainer(self, api_client, client_user, trainer_profile, sample_review):
        """Test filtering reviews by trainer ID"""
        api_client.force_authenticate(user=client_user)

        response = api_client.get(f'/api/v1/bookings/reviews/?trainer={trainer_profile.id}')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['trainer'] == trainer_profile.id  # trainer is just an ID

    def test_client_can_see_own_reviews_including_hidden(self, api_client, client_user, trainer_profile):
        """Test that clients can see their own reviews even if hidden"""
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
        Review.objects.create(
            trainer=trainer_profile,
            client=client_user,
            booking=completed_booking,
            rating=5,
            comment='My hidden review',
            is_visible=False
        )

        api_client.force_authenticate(user=client_user)
        response = api_client.get('/api/v1/bookings/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['is_visible'] is False

    def test_create_review_requires_authentication(self, api_client, completed_booking, trainer_profile):
        """Test that creating a review requires authentication"""
        review_data = {
            'booking': completed_booking.id,
            'rating': 5,
            'comment': 'Great session!'
        }
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_client_can_create_review(self, api_client, client_user, completed_booking):
        """Test that clients can create reviews for completed bookings"""
        api_client.force_authenticate(user=client_user)

        review_data = {
            'booking': completed_booking.id,
            'rating': 5,
            'comment': 'Excellent trainer! Very professional and knowledgeable.'
        }
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['rating'] == 5
        assert response.data['comment'] == 'Excellent trainer! Very professional and knowledgeable.'
        assert response.data['booking'] == completed_booking.id

        # Verify in database
        from bookings.models import Review
        review = Review.objects.get(booking=completed_booking)
        assert review.is_verified is True
        assert review.is_visible is True

    def test_trainer_cannot_create_review(self, api_client, trainer_user, completed_booking):
        """Test that trainers cannot create reviews"""
        api_client.force_authenticate(user=trainer_user)

        review_data = {
            'booking': completed_booking.id,
            'rating': 5,
            'comment': 'Great client!'
        }
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')

        # Validation happens first (400) before permission check (403)
        # The booking validation fails because trainer_user != booking.client
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'only review your own bookings' in str(response.data).lower()

    def test_cannot_create_duplicate_review(self, api_client, client_user, completed_booking, sample_review):
        """Test that clients cannot create multiple reviews for the same booking"""
        api_client.force_authenticate(user=client_user)

        review_data = {
            'booking': completed_booking.id,
            'rating': 4,
            'comment': 'Another review'
        }
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_review_pending_booking(self, api_client, client_user, trainer_profile):
        """Test that clients cannot review bookings that aren't completed"""
        pending_booking = Booking.objects.create(
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

        api_client.force_authenticate(user=client_user)

        review_data = {
            'booking': pending_booking.id,
            'rating': 5,
            'comment': 'Great session!'
        }
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rating_must_be_between_1_and_5(self, api_client, client_user, completed_booking):
        """Test that rating must be between 1 and 5"""
        api_client.force_authenticate(user=client_user)

        # Test rating too low
        review_data = {
            'booking': completed_booking.id,
            'rating': 0,
            'comment': 'Bad'
        }
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test rating too high
        review_data['rating'] = 6
        response = api_client.post('/api/v1/bookings/reviews/', review_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestReviewDetailView:
    """Test review detail, update, and deletion endpoints"""

    def test_get_review_requires_authentication(self, api_client, sample_review):
        """Test that getting review details requires authentication"""
        response = api_client.get(f'/api/v1/bookings/reviews/{sample_review.id}/')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_client_can_get_own_review(self, api_client, client_user, sample_review):
        """Test that clients can get their own reviews"""
        api_client.force_authenticate(user=client_user)
        response = api_client.get(f'/api/v1/bookings/reviews/{sample_review.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == sample_review.id
        assert response.data['rating'] == 5

    def test_trainer_can_view_visible_review(self, api_client, trainer_user, sample_review):
        """Test that trainers can view visible reviews"""
        api_client.force_authenticate(user=trainer_user)
        response = api_client.get(f'/api/v1/bookings/reviews/{sample_review.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == sample_review.id

    def test_client_can_update_own_review(self, api_client, client_user, sample_review):
        """Test that clients can update their own reviews"""
        api_client.force_authenticate(user=client_user)

        update_data = {
            'rating': 4,
            'comment': 'Updated comment - Still great but had a minor issue.'
        }
        response = api_client.patch(
            f'/api/v1/bookings/reviews/{sample_review.id}/',
            update_data,
            format='json'
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['rating'] == 4
        assert 'Updated comment' in response.data['comment']

        # Verify in database
        sample_review.refresh_from_db()
        assert sample_review.rating == 4

    def test_client_cannot_update_other_review(self, api_client, other_client_user, sample_review):
        """Test that clients cannot update reviews from other clients"""
        api_client.force_authenticate(user=other_client_user)

        update_data = {
            'rating': 1,
            'comment': 'Trying to change someone else\'s review'
        }
        response = api_client.patch(
            f'/api/v1/bookings/reviews/{sample_review.id}/',
            update_data,
            format='json'
        )

        # Should get 404 because they can't access it
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_trainer_cannot_update_review(self, api_client, trainer_user, sample_review):
        """Test that trainers cannot update reviews"""
        api_client.force_authenticate(user=trainer_user)

        update_data = {
            'rating': 5,
            'comment': 'Trying to change a review'
        }
        response = api_client.patch(
            f'/api/v1/bookings/reviews/{sample_review.id}/',
            update_data,
            format='json'
        )

        # Trainers can't update reviews, permission denied
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_client_can_delete_own_review(self, api_client, client_user, sample_review):
        """Test that clients can delete their own reviews"""
        api_client.force_authenticate(user=client_user)

        response = api_client.delete(f'/api/v1/bookings/reviews/{sample_review.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify deleted from database
        assert not Review.objects.filter(id=sample_review.id).exists()

    def test_client_cannot_delete_other_review(self, api_client, other_client_user, sample_review):
        """Test that clients cannot delete reviews from other clients"""
        api_client.force_authenticate(user=other_client_user)

        response = api_client.delete(f'/api/v1/bookings/reviews/{sample_review.id}/')

        # Should get 404 because they can't access it
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Verify review still exists
        assert Review.objects.filter(id=sample_review.id).exists()

    def test_trainer_cannot_delete_review(self, api_client, trainer_user, sample_review):
        """Test that trainers cannot delete reviews"""
        api_client.force_authenticate(user=trainer_user)

        response = api_client.delete(f'/api/v1/bookings/reviews/{sample_review.id}/')

        # Permission denied
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Verify review still exists
        assert Review.objects.filter(id=sample_review.id).exists()


@pytest.mark.django_db
class TestTrainerReviewsView:
    """Test trainer-specific review listing endpoint"""

    def test_get_trainer_reviews_without_auth(self, api_client, trainer_profile, sample_review):
        """Test that anyone can view trainer reviews (public endpoint)"""
        response = api_client.get(f'/api/v1/trainers/{trainer_profile.id}/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == sample_review.id

    def test_only_visible_reviews_shown(self, api_client, trainer_profile, client_user):
        """Test that only visible reviews are shown in trainer review list"""
        # Create visible review
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
            comment='Great!',
            is_visible=True
        )

        # Create hidden review
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
            comment='Hidden',
            is_visible=False
        )

        response = api_client.get(f'/api/v1/trainers/{trainer_profile.id}/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['is_visible'] is True

    def test_nonexistent_trainer_returns_404(self, api_client):
        """Test that requesting reviews for nonexistent trainer returns 404"""
        response = api_client.get('/api/v1/trainers/99999/reviews/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_reviews_ordered_by_newest_first(self, api_client, trainer_profile, client_user):
        """Test that reviews are ordered from newest to oldest"""
        # Create 3 bookings and reviews
        for days_ago in [10, 5, 1]:
            booking = Booking.objects.create(
                trainer=trainer_profile,
                client=client_user,
                session_date=date.today() - timedelta(days=days_ago+1),
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
                booking=booking,
                rating=5,
                comment=f'Review from {days_ago} days ago',
                is_visible=True
            )

        response = api_client.get(f'/api/v1/trainers/{trainer_profile.id}/reviews/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

        # Verify ordering (newest first)
        comments = [r['comment'] for r in response.data['results']]
        assert '1 days ago' in comments[0]
        assert '5 days ago' in comments[1]
        assert '10 days ago' in comments[2]
