import pytest
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from trainers.models import Specialization, TrainerProfile, TrainerPhoto
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def trainer_user(db):
    """Create a trainer user"""
    return User.objects.create_user(
        email='trainer@test.com',
        username='testtrainer',
        password='TestPass123!',
        role='trainer',
        email_verified=True
    )


@pytest.fixture
def client_user(db):
    """Create a client user"""
    return User.objects.create_user(
        email='client@test.com',
        username='testclient',
        password='TestPass123!',
        role='client',
        email_verified=True
    )


@pytest.fixture
def specializations(db):
    """Create test specializations"""
    return [
        Specialization.objects.create(
            name='Yoga',
            slug='yoga',
            icon='🧘',
            description='Flexibility and mindfulness'
        ),
        Specialization.objects.create(
            name='HIIT',
            slug='hiit',
            icon='🔥',
            description='High-intensity interval training'
        ),
        Specialization.objects.create(
            name='Strength Training',
            slug='strength-training',
            icon='💪',
            description='Build muscle'
        ),
    ]


@pytest.fixture
def trainer_profile(trainer_user, specializations):
    """Create a trainer profile"""
    profile = TrainerProfile.objects.create(
        user=trainer_user,
        bio="Experienced yoga instructor",
        years_experience=5,
        address="123 Main St, San Francisco, CA",
        location=Point(-122.4194, 37.7749),
        hourly_rate=75.00,
    )
    profile.specializations.add(*specializations[:2])
    return profile


def create_test_image():
    """Create a test image file"""
    file = BytesIO()
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile('test.jpg', file.read(), content_type='image/jpeg')


@pytest.mark.django_db
class TestSpecializationListView:
    """Test specializations list endpoint"""

    def test_list_specializations(self, api_client, specializations):
        """Test that all specializations are returned"""
        response = api_client.get('/api/v1/trainers/specializations/')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert response.data[0]['name'] in ['Yoga', 'HIIT', 'Strength Training']

    def test_specializations_fields(self, api_client, specializations):
        """Test that specializations have all required fields"""
        response = api_client.get('/api/v1/trainers/specializations/')

        first_spec = response.data[0]
        assert 'id' in first_spec
        assert 'name' in first_spec
        assert 'slug' in first_spec
        assert 'icon' in first_spec
        assert 'description' in first_spec


@pytest.mark.django_db
class TestTrainerProfileCreateView:
    """Test trainer profile create/update endpoint"""

    def test_create_profile_unauthenticated(self, api_client, specializations):
        """Test that unauthenticated users cannot create profiles"""
        data = {
            'bio': 'Test bio',
            'years_experience': 3,
            'hourly_rate': 50.00,
            'specialization_ids': [specializations[0].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_profile_as_client(self, api_client, client_user, specializations):
        """Test that clients cannot create trainer profiles"""
        api_client.force_authenticate(user=client_user)

        data = {
            'bio': 'Test bio',
            'years_experience': 3,
            'hourly_rate': 50.00,
            'specialization_ids': [specializations[0].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_profile_success(self, api_client, trainer_user, specializations):
        """Test successful profile creation"""
        api_client.force_authenticate(user=trainer_user)

        # Delete auto-created profile from signal
        TrainerProfile.objects.filter(user=trainer_user).delete()

        data = {
            'bio': 'Experienced trainer with passion for fitness',
            'years_experience': 5,
            'address': '123 Main St, San Francisco, CA',
            'service_radius_miles': 15,
            'hourly_rate': 75.00,
            'specialization_ids': [specializations[0].id, specializations[1].id],
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['bio'] == data['bio']
        assert response.data['years_experience'] == data['years_experience']
        assert float(response.data['hourly_rate']) == data['hourly_rate']
        assert len(response.data['specializations']) == 2

    def test_update_existing_profile(self, api_client, trainer_user, trainer_profile):
        """Test updating existing profile"""
        api_client.force_authenticate(user=trainer_user)

        data = {
            'bio': 'Updated bio',
            'years_experience': 7,
            'hourly_rate': 85.00,
        }

        response = api_client.post('/api/v1/trainers/profile/', data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['bio'] == 'Updated bio'
        assert response.data['years_experience'] == 7

    def test_get_own_profile(self, api_client, trainer_user, trainer_profile):
        """Test retrieving own profile"""
        api_client.force_authenticate(user=trainer_user)

        response = api_client.get('/api/v1/trainers/profile/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_email'] == trainer_user.email
        assert response.data['bio'] == trainer_profile.bio


@pytest.mark.django_db
class TestTrainerPhotoUploadView:
    """Test photo upload endpoint"""

    def test_upload_photo_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot upload photos"""
        photo = create_test_image()

        data = {
            'photo': photo,
            'photo_type': 'profile',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_photo_as_client(self, api_client, client_user):
        """Test that clients cannot upload trainer photos"""
        api_client.force_authenticate(user=client_user)
        photo = create_test_image()

        data = {
            'photo': photo,
            'photo_type': 'profile',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_photo_success(self, api_client, trainer_user, trainer_profile):
        """Test successful photo upload"""
        api_client.force_authenticate(user=trainer_user)
        photo = create_test_image()

        data = {
            'photo': photo,
            'photo_type': 'profile',
            'caption': 'My profile photo',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['photo_type'] == 'profile'
        assert response.data['caption'] == 'My profile photo'
        assert 'photo' in response.data

    def test_upload_multiple_photos(self, api_client, trainer_user, trainer_profile):
        """Test uploading multiple photos"""
        api_client.force_authenticate(user=trainer_user)

        # Upload first photo
        photo1 = create_test_image()
        response1 = api_client.post('/api/v1/trainers/profile/photos/', {
            'photo': photo1,
            'photo_type': 'profile',
        }, format='multipart')

        # Upload second photo
        photo2 = create_test_image()
        response2 = api_client.post('/api/v1/trainers/profile/photos/', {
            'photo': photo2,
            'photo_type': 'gym',
        }, format='multipart')

        assert response1.status_code == status.HTTP_201_CREATED
        assert response2.status_code == status.HTTP_201_CREATED

        # Check that profile has 2 photos
        assert trainer_profile.photos.count() == 2

    def test_upload_photo_without_profile(self, api_client, trainer_user):
        """Test that photo upload fails without a profile"""
        # Delete the auto-created profile
        TrainerProfile.objects.filter(user=trainer_user).delete()

        api_client.force_authenticate(user=trainer_user)
        photo = create_test_image()

        data = {
            'photo': photo,
            'photo_type': 'profile',
        }

        response = api_client.post('/api/v1/trainers/profile/photos/', data, format='multipart')
        assert response.status_code == status.HTTP_404_NOT_FOUND
