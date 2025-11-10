"""
Integration tests for Trainer Detail Public View API (TASK-008)

Tests the public trainer profile endpoint that clients use to view
trainer details before booking.
"""

import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status

from users.models import User
from trainers.models import (
    TrainerProfile,
    Specialization,
    TrainerPhoto,
    TrainerCertification
)


@pytest.fixture
def api_client():
    """Create API client for testing"""
    return APIClient()


@pytest.fixture
def specializations(db):
    """Create test specializations"""
    specs = []
    for name, icon in [
        ('Yoga', '🧘'),
        ('HIIT', '🔥'),
        ('Strength Training', '💪'),
    ]:
        spec = Specialization.objects.create(
            name=name,
            icon=icon,
            description=f'{name} training'
        )
        specs.append(spec)
    return specs


@pytest.fixture
def published_trainer(db, specializations):
    """Create a published trainer profile for testing"""
    user = User.objects.create_user(
        username='john_trainer',
        email='john@trainers.com',
        password='testpass123',
        role='trainer',
        first_name='John',
        last_name='Smith'
    )

    profile = TrainerProfile.objects.create(
        user=user,
        bio='Experienced personal trainer with 10 years in the industry. Specializing in strength training and HIIT workouts.',
        years_experience=10,
        hourly_rate=85.00,
        address='123 Fitness Ave, San Francisco, CA 94102',
        location=Point(-122.4194, 37.7749, srid=4326),  # San Francisco coordinates
        service_radius_miles=15,
        verified=True,
        published=True,  # Must be published to be visible
        average_rating=4.8,
        total_reviews=25
    )

    # Add specializations
    profile.specializations.add(specializations[0], specializations[2])

    return profile


@pytest.fixture
def unpublished_trainer(db):
    """Create an unpublished trainer profile (should not be visible)"""
    user = User.objects.create_user(
        username='jane_trainer',
        email='jane@trainers.com',
        password='testpass123',
        role='trainer',
        first_name='Jane',
        last_name='Doe'
    )

    profile = TrainerProfile.objects.create(
        user=user,
        bio='New trainer',
        years_experience=2,
        hourly_rate=50.00,
        published=False  # Not published
    )

    return profile


class TestTrainerDetailPublicAPI:
    """Test the public trainer detail endpoint"""

    def test_get_published_trainer_unauthenticated(self, api_client, published_trainer):
        """Test that published trainers can be viewed without authentication"""
        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK

        # GeoFeatureModelSerializer returns GeoJSON Feature format
        assert 'location' in response.data

        # Check properties
        # Direct access to response.data
        assert response.data['id'] == published_trainer.id
        assert response.data['bio'] == published_trainer.bio

    def test_trainer_detail_includes_all_fields(self, api_client, published_trainer):
        """Test that trainer detail includes all necessary fields"""
        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK

        # Get properties from GeoJSON Feature
        # Direct access to response.data

        # User information
        assert 'user' in response.data
        assert response.data['user']['first_name'] == 'John'
        assert response.data['user']['last_name'] == 'Smith'
        assert 'email' not in response.data['user']  # Email should not be exposed

        # Profile information
        assert response.data['bio'] == published_trainer.bio
        assert response.data['years_experience'] == 10
        assert float(response.data['hourly_rate']) == 85.00
        assert response.data['address'] == published_trainer.address
        assert response.data['service_radius_miles'] == 15
        assert response.data['verified'] is True

        # Rating information
        assert float(response.data['average_rating']) == 4.8
        assert response.data['total_reviews'] == 25

        # Specializations
        assert 'specializations' in response.data
        assert len(response.data['specializations']) == 2

        # Photos and certifications (should be empty arrays but present)
        assert 'photos' in response.data
        assert 'certifications' in response.data

    def test_trainer_detail_includes_location_coordinates(self, api_client, published_trainer):
        """Test that location coordinates are included for map display"""
        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK

        # Check location (GeoJSON format)
        assert 'location' in response.data
        location = response.data['location']
        assert 'type' in location
        assert location['type'] == 'Point'
        assert 'coordinates' in location
        assert len(location['coordinates']) == 2
        # Coordinates are [longitude, latitude]
        assert -123 < location['coordinates'][0] < -122  # SF longitude range
        assert 37 < location['coordinates'][1] < 38      # SF latitude range

    def test_unpublished_trainer_not_accessible(self, api_client, unpublished_trainer):
        """Test that unpublished trainers are not accessible via public API"""
        response = api_client.get(f'/api/v1/trainers/{unpublished_trainer.id}/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_nonexistent_trainer_returns_404(self, api_client, db):
        """Test that requesting non-existent trainer returns 404"""
        response = api_client.get('/api/v1/trainers/99999/')

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_trainer_with_photos(self, api_client, published_trainer):
        """Test trainer detail with multiple photos"""
        from PIL import Image
        import io
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Create test photos
        for i, photo_type in enumerate(['profile', 'gym', 'action']):
            image = Image.new('RGB', (100, 100), color='red')
            img_io = io.BytesIO()
            image.save(img_io, format='JPEG')
            img_io.seek(0)

            photo_file = SimpleUploadedFile(
                name=f'test_{photo_type}.jpg',
                content=img_io.read(),
                content_type='image/jpeg'
            )

            TrainerPhoto.objects.create(
                trainer=published_trainer,
                photo=photo_file,
                photo_type=photo_type,
                caption=f'My {photo_type} photo',
                order=i
            )

        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['photos']) == 3

        # Verify photos are ordered
        assert response.data['photos'][0]['photo_type'] == 'profile'
        assert response.data['photos'][1]['photo_type'] == 'gym'
        assert response.data['photos'][2]['photo_type'] == 'action'

    def test_trainer_with_certifications(self, api_client, published_trainer):
        """Test trainer detail with certifications"""
        from datetime import date, timedelta

        # Create certifications
        TrainerCertification.objects.create(
            trainer=published_trainer,
            name='NASM Certified Personal Trainer',
            issuing_organization='National Academy of Sports Medicine',
            issue_date=date(2020, 1, 1),
            expiry_date=date.today() + timedelta(days=365),  # Valid for 1 more year
            credential_id='NASM-CPT-123456'
        )

        TrainerCertification.objects.create(
            trainer=published_trainer,
            name='CrossFit Level 1 Trainer',
            issuing_organization='CrossFit Inc.',
            issue_date=date(2019, 6, 1),
            expiry_date=date.today() - timedelta(days=30),  # Expired
            credential_id='CF-L1-789012'
        )

        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['certifications']) == 2

        # Find NASM cert (should not be expired)
        nasm_cert = next(c for c in response.data['certifications'] if 'NASM' in c['name'])
        assert nasm_cert['issuing_organization'] == 'National Academy of Sports Medicine'
        assert nasm_cert['credential_id'] == 'NASM-CPT-123456'

    def test_trainer_specializations_include_details(self, api_client, published_trainer):
        """Test that specializations include icon and description"""
        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK

        specializations = response.data['specializations']
        assert len(specializations) == 2

        # Check first specialization has all fields
        spec = specializations[0]
        assert 'id' in spec
        assert 'name' in spec
        assert 'slug' in spec
        assert 'icon' in spec
        assert 'description' in spec

    def test_trainer_without_location(self, api_client, db):
        """Test trainer without location still returns properly"""
        user = User.objects.create_user(
            username='no_location_trainer',
            email='nolocation@trainers.com',
            password='testpass123',
            role='trainer',
            first_name='No',
            last_name='Location'
        )

        profile = TrainerProfile.objects.create(
            user=user,
            bio='Trainer without location',
            years_experience=3,
            hourly_rate=60.00,
            published=True,
            location=None  # No location set
        )

        response = api_client.get(f'/api/v1/trainers/{profile.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['location'] is None

    def test_trainer_slug_generation(self, api_client, published_trainer):
        """Test that trainer has a slug for SEO-friendly URLs"""
        response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert 'slug' in response.data
        assert response.data['slug'] is not None
        assert len(response.data['slug']) > 0

    def test_trainer_with_no_reviews(self, api_client, db):
        """Test trainer with no reviews shows rating as 0"""
        user = User.objects.create_user(
            username='new_trainer',
            email='new@trainers.com',
            password='testpass123',
            role='trainer',
            first_name='New',
            last_name='Trainer'
        )

        profile = TrainerProfile.objects.create(
            user=user,
            bio='Brand new trainer',
            years_experience=0,
            hourly_rate=40.00,
            published=True,
            average_rating=0.00,
            total_reviews=0
        )

        response = api_client.get(f'/api/v1/trainers/{profile.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['average_rating']) == 0.00
        assert response.data['total_reviews'] == 0

    def test_multiple_trainers_independence(self, api_client, published_trainer, db):
        """Test that multiple trainers don't interfere with each other"""
        # Create second trainer
        user2 = User.objects.create_user(
            username='trainer2',
            email='trainer2@test.com',
            password='testpass123',
            role='trainer',
            first_name='Second',
            last_name='Trainer'
        )

        profile2 = TrainerProfile.objects.create(
            user=user2,
            bio='Second trainer bio',
            years_experience=5,
            hourly_rate=70.00,
            published=True
        )

        # Fetch first trainer
        response1 = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')
        assert response1.status_code == status.HTTP_200_OK
        assert response1.data['user']['first_name'] == 'John'

        # Fetch second trainer
        response2 = api_client.get(f'/api/v1/trainers/{profile2.id}/')
        assert response2.status_code == status.HTTP_200_OK
        assert response2.data['user']['first_name'] == 'Second'

        # Verify they're different
        assert response1.data['id'] != response2.data['id']
        assert response1.data['bio'] != response2.data['bio']


class TestTrainerDetailPerformance:
    """Test that trainer detail endpoint is optimized"""

    def test_no_n_plus_one_queries(self, api_client, published_trainer, specializations, django_assert_num_queries):
        """Test that fetching trainer doesn't cause N+1 query problem"""
        # Add photos and certifications
        from PIL import Image
        import io
        from django.core.files.uploadedfile import SimpleUploadedFile
        from datetime import date

        for i in range(3):
            image = Image.new('RGB', (100, 100))
            img_io = io.BytesIO()
            image.save(img_io, format='JPEG')
            img_io.seek(0)

            TrainerPhoto.objects.create(
                trainer=published_trainer,
                photo=SimpleUploadedFile(f'test{i}.jpg', img_io.read(), 'image/jpeg'),
                photo_type='gym'
            )

            TrainerCertification.objects.create(
                trainer=published_trainer,
                name=f'Certification {i}',
                issuing_organization=f'Org {i}',
                issue_date=date(2020, 1, 1)
            )

        # Should use select_related/prefetch_related to avoid N+1
        # Expected queries:
        # 1. Get TrainerProfile with user (select_related)
        # 2. Prefetch specializations
        # 3. Prefetch photos
        # 4. Prefetch certifications
        with django_assert_num_queries(4):
            response = api_client.get(f'/api/v1/trainers/{published_trainer.id}/')
            assert response.status_code == status.HTTP_200_OK
