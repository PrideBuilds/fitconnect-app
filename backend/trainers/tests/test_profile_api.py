"""
Integration tests for Trainer Profile Creation API (TASK-006)

Tests the complete profile creation flow including:
- Profile creation/update via API
- Photo uploads
- Specialization selection
- Form validation
"""

import pytest
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image
import io

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
def trainer_user(db):
    """Create a trainer user for testing"""
    user = User.objects.create_user(
        username='trainer_john',
        email='trainer@test.com',
        password='testpass123',
        role='trainer',
        first_name='John',
        last_name='Trainer'
    )
    return user


@pytest.fixture
def client_user(db):
    """Create a client user for testing"""
    user = User.objects.create_user(
        username='client_jane',
        email='client@test.com',
        password='testpass123',
        role='client',
        first_name='Jane',
        last_name='Client'
    )
    return user


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
def sample_image():
    """Create a sample image file for upload testing"""
    image = Image.new('RGB', (100, 100), color='red')
    img_io = io.BytesIO()
    image.save(img_io, format='JPEG')
    img_io.seek(0)
    return SimpleUploadedFile(
        name='test_photo.jpg',
        content=img_io.read(),
        content_type='image/jpeg'
    )


class TestSpecializationListAPI:
    """Test specialization list endpoint (public)"""

    def test_list_specializations_unauthenticated(self, api_client, specializations):
        """Test that specializations can be fetched without authentication"""
        response = api_client.get('/api/v1/trainers/specializations/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert response.data[0]['name'] in ['Yoga', 'HIIT', 'Strength Training']

    def test_specializations_include_all_fields(self, api_client, specializations):
        """Test that specializations include all required fields"""
        response = api_client.get('/api/v1/trainers/specializations/')

        assert response.status_code == status.HTTP_200_OK
        spec = response.data[0]
        assert 'id' in spec
        assert 'name' in spec
        assert 'slug' in spec
        assert 'icon' in spec
        assert 'description' in spec


class TestTrainerProfileAPI:
    """Test trainer profile creation and update endpoints"""

    def test_create_profile_requires_authentication(self, api_client, specializations):
        """Test that profile creation requires authentication"""
        data = {
            'bio': 'Test bio',
            'years_experience': 5,
            'hourly_rate': 75.00,
            'address': '123 Main St, San Francisco, CA',
            'service_radius_miles': 10,
            'specialization_ids': [specializations[0].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_profile_requires_trainer_role(self, api_client, client_user, specializations):
        """Test that only trainers can create profiles"""
        api_client.force_authenticate(user=client_user)

        data = {
            'bio': 'Test bio',
            'years_experience': 5,
            'hourly_rate': 75.00,
            'address': '123 Main St, San Francisco, CA',
            'service_radius_miles': 10,
            'specialization_ids': [specializations[0].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_profile_success(self, api_client, trainer_user, specializations):
        """Test successful profile creation with valid data"""
        api_client.force_authenticate(user=trainer_user)

        data = {
            'bio': 'Experienced personal trainer specializing in strength training',
            'years_experience': 5,
            'hourly_rate': 75.00,
            'address': '123 Main St, San Francisco, CA',
            'service_radius_miles': 10,
            'specialization_ids': [specializations[0].id, specializations[1].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['bio'] == data['bio']
        assert response.data['years_experience'] == data['years_experience']
        assert float(response.data['hourly_rate']) == data['hourly_rate']
        assert response.data['address'] == data['address']
        assert response.data['service_radius_miles'] == data['service_radius_miles']
        assert len(response.data['specializations']) == 2

        # Verify profile exists in database
        profile = TrainerProfile.objects.get(user=trainer_user)
        assert profile.bio == data['bio']
        assert profile.specializations.count() == 2

    def test_create_profile_validation_bio_max_length(self, api_client, trainer_user, specializations):
        """Test bio max length validation (500 characters)"""
        api_client.force_authenticate(user=trainer_user)

        data = {
            'bio': 'x' * 501,  # Exceeds max length
            'years_experience': 5,
            'hourly_rate': 75.00,
            'address': '123 Main St',
            'specialization_ids': [specializations[0].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'bio' in response.data

    def test_create_profile_validation_years_experience_range(self, api_client, trainer_user):
        """Test years_experience validation (0-50)"""
        api_client.force_authenticate(user=trainer_user)

        # Test negative years
        data = {
            'bio': 'Test bio',
            'years_experience': -1,
            'hourly_rate': 75.00,
            'address': '123 Main St',
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # Test exceeds max
        data['years_experience'] = 51
        response = api_client.post('/api/v1/trainers/profile/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_profile_validation_hourly_rate_positive(self, api_client, trainer_user):
        """Test hourly_rate must be positive"""
        api_client.force_authenticate(user=trainer_user)

        data = {
            'bio': 'Test bio',
            'years_experience': 5,
            'hourly_rate': -10.00,
            'address': '123 Main St',
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'hourly_rate' in response.data

    def test_update_profile_success(self, api_client, trainer_user, specializations):
        """Test updating an existing profile"""
        # Create initial profile
        TrainerProfile.objects.create(
            user=trainer_user,
            bio='Old bio',
            years_experience=3,
            hourly_rate=50.00,
            address='Old address'
        )

        api_client.force_authenticate(user=trainer_user)

        data = {
            'bio': 'Updated bio with new information',
            'years_experience': 5,
            'hourly_rate': 85.00,
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['bio'] == data['bio']
        assert response.data['years_experience'] == data['years_experience']
        assert float(response.data['hourly_rate']) == data['hourly_rate']

        # Verify only one profile exists
        assert TrainerProfile.objects.filter(user=trainer_user).count() == 1

    def test_get_profile_success(self, api_client, trainer_user, specializations):
        """Test retrieving trainer's own profile"""
        profile = TrainerProfile.objects.create(
            user=trainer_user,
            bio='Test bio',
            years_experience=5,
            hourly_rate=75.00,
            address='123 Main St'
        )
        profile.specializations.add(specializations[0])

        api_client.force_authenticate(user=trainer_user)

        response = api_client.get('/api/v1/trainers/profile/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['bio'] == 'Test bio'
        assert len(response.data['specializations']) == 1

    def test_get_profile_not_found(self, api_client, trainer_user):
        """Test retrieving profile when none exists"""
        api_client.force_authenticate(user=trainer_user)

        response = api_client.get('/api/v1/trainers/profile/')

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTrainerPhotoAPI:
    """Test photo upload and management endpoints"""

    def test_upload_photo_requires_authentication(self, api_client, sample_image):
        """Test that photo upload requires authentication"""
        data = {
            'photo': sample_image,
            'photo_type': 'profile',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_photo_requires_profile(self, api_client, trainer_user, sample_image):
        """Test that photo upload requires existing profile"""
        api_client.force_authenticate(user=trainer_user)

        data = {
            'photo': sample_image,
            'photo_type': 'profile',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert 'profile' in response.data['error'].lower()

    def test_upload_photo_success(self, api_client, trainer_user, sample_image):
        """Test successful photo upload"""
        # Create profile first
        profile = TrainerProfile.objects.create(
            user=trainer_user,
            bio='Test bio',
            years_experience=5,
            hourly_rate=75.00
        )

        api_client.force_authenticate(user=trainer_user)

        data = {
            'photo': sample_image,
            'photo_type': 'profile',
            'caption': 'My profile photo',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['photo_type'] == 'profile'
        assert response.data['caption'] == 'My profile photo'
        assert 'photo' in response.data

        # Verify photo exists in database
        assert TrainerPhoto.objects.filter(trainer=profile).count() == 1

    def test_upload_multiple_photos(self, api_client, trainer_user):
        """Test uploading multiple photos"""
        profile = TrainerProfile.objects.create(
            user=trainer_user,
            bio='Test bio',
            years_experience=5,
            hourly_rate=75.00
        )

        api_client.force_authenticate(user=trainer_user)

        # Upload 3 photos
        for i in range(3):
            image = Image.new('RGB', (100, 100), color='blue')
            img_io = io.BytesIO()
            image.save(img_io, format='JPEG')
            img_io.seek(0)

            photo_file = SimpleUploadedFile(
                name=f'test_photo_{i}.jpg',
                content=img_io.read(),
                content_type='image/jpeg'
            )

            data = {
                'photo': photo_file,
                'photo_type': 'gym',
            }

            response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')
            assert response.status_code == status.HTTP_201_CREATED

        # Verify all photos exist
        assert TrainerPhoto.objects.filter(trainer=profile).count() == 3

    def test_upload_photo_validation_file_type(self, api_client, trainer_user):
        """Test photo upload file type validation"""
        profile = TrainerProfile.objects.create(
            user=trainer_user,
            bio='Test bio',
            years_experience=5,
            hourly_rate=75.00
        )

        api_client.force_authenticate(user=trainer_user)

        # Create a text file instead of image
        text_file = SimpleUploadedFile(
            name='test.txt',
            content=b'This is not an image',
            content_type='text/plain'
        )

        data = {
            'photo': text_file,
            'photo_type': 'profile',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')

        # Should fail validation
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_photo_type(self, api_client, trainer_user, sample_image):
        """Test updating photo type"""
        profile = TrainerProfile.objects.create(
            user=trainer_user,
            bio='Test bio',
            years_experience=5,
            hourly_rate=75.00
        )

        # Create photo
        photo = TrainerPhoto.objects.create(
            trainer=profile,
            photo=sample_image,
            photo_type='gym'
        )

        api_client.force_authenticate(user=trainer_user)

        data = {
            'photo_type': 'profile',
        }

        response = api_client.patch(f'/api/v1/trainers/profile/photos/{photo.id}/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['photo_type'] == 'profile'

        # Verify in database
        photo.refresh_from_db()
        assert photo.photo_type == 'profile'

    def test_delete_photo(self, api_client, trainer_user, sample_image):
        """Test deleting a photo"""
        profile = TrainerProfile.objects.create(
            user=trainer_user,
            bio='Test bio',
            years_experience=5,
            hourly_rate=75.00
        )

        # Create photo
        photo = TrainerPhoto.objects.create(
            trainer=profile,
            photo=sample_image,
            photo_type='gym'
        )

        photo_id = photo.id

        api_client.force_authenticate(user=trainer_user)

        response = api_client.delete(f'/api/v1/trainers/profile/photos/{photo_id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify photo deleted from database
        assert not TrainerPhoto.objects.filter(id=photo_id).exists()

    def test_cannot_update_other_trainer_photo(self, api_client, sample_image, db):
        """Test that trainers cannot update other trainers' photos"""
        # Create two trainers
        trainer1 = User.objects.create_user(
            username='trainer1',
            email='trainer1@test.com',
            password='testpass123',
            role='trainer'
        )
        trainer2 = User.objects.create_user(
            username='trainer2',
            email='trainer2@test.com',
            password='testpass123',
            role='trainer'
        )

        profile1 = TrainerProfile.objects.create(
            user=trainer1,
            bio='Trainer 1',
            years_experience=5,
            hourly_rate=75.00
        )

        photo = TrainerPhoto.objects.create(
            trainer=profile1,
            photo=sample_image,
            photo_type='gym'
        )

        # Authenticate as trainer2
        api_client.force_authenticate(user=trainer2)

        # Try to update trainer1's photo
        data = {'photo_type': 'profile'}
        response = api_client.patch(f'/api/v1/trainers/profile/photos/{photo.id}/', data, format='json')

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestProfileCreationIntegration:
    """Integration tests for complete profile creation flow"""

    def test_complete_profile_creation_flow(self, api_client, trainer_user, specializations):
        """Test the complete flow from profile creation to photo upload"""
        api_client.force_authenticate(user=trainer_user)

        # Step 1: Create profile
        profile_data = {
            'bio': 'Experienced personal trainer with 5 years of experience',
            'years_experience': 5,
            'hourly_rate': 75.00,
            'address': '123 Main St, San Francisco, CA 94102',
            'service_radius_miles': 10,
            'specialization_ids': [specializations[0].id, specializations[1].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', profile_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        profile_id = response.data['id']

        # Step 2: Upload profile photo
        image1 = Image.new('RGB', (200, 200), color='red')
        img_io1 = io.BytesIO()
        image1.save(img_io1, format='JPEG')
        img_io1.seek(0)

        photo1_file = SimpleUploadedFile(
            name='profile_photo.jpg',
            content=img_io1.read(),
            content_type='image/jpeg'
        )

        photo_data = {
            'photo': photo1_file,
            'photo_type': 'profile',
            'caption': 'My professional headshot',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', photo_data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED

        # Step 3: Upload gym photo
        image2 = Image.new('RGB', (200, 200), color='blue')
        img_io2 = io.BytesIO()
        image2.save(img_io2, format='JPEG')
        img_io2.seek(0)

        photo2_file = SimpleUploadedFile(
            name='gym_photo.jpg',
            content=img_io2.read(),
            content_type='image/jpeg'
        )

        photo_data = {
            'photo': photo2_file,
            'photo_type': 'gym',
            'caption': 'My training facility',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', photo_data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED

        # Step 4: Verify complete profile
        response = api_client.get('/api/v1/trainers/profile/')
        assert response.status_code == status.HTTP_200_OK

        # Verify all data
        assert response.data['bio'] == profile_data['bio']
        assert response.data['years_experience'] == profile_data['years_experience']
        assert len(response.data['specializations']) == 2
        assert len(response.data['photos']) == 2

        # Verify photos have correct types
        photo_types = {photo['photo_type'] for photo in response.data['photos']}
        assert 'profile' in photo_types
        assert 'gym' in photo_types

        # Verify profile in database
        profile = TrainerProfile.objects.get(id=profile_id)
        assert profile.photos.count() == 2
        assert profile.specializations.count() == 2

    def test_profile_not_published_by_default(self, api_client, trainer_user, specializations):
        """Test that new profiles are not published by default"""
        api_client.force_authenticate(user=trainer_user)

        profile_data = {
            'bio': 'Test bio',
            'years_experience': 5,
            'hourly_rate': 75.00,
            'address': '123 Main St',
            'specialization_ids': [specializations[0].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', profile_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        # Verify not published
        profile = TrainerProfile.objects.get(user=trainer_user)
        assert profile.published is False
        assert profile.profile_complete is False
