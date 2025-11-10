import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User, ClientProfile, TrainerProfile


@pytest.mark.django_db
class TestRoleBasedPermissions:
    """Test role-based access control"""

    def setup_method(self):
        self.client_api = APIClient()

        # Create client user
        self.client_user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='password123',
            role='client',
            email_verified=True
        )

        # Create trainer user
        self.trainer_user = User.objects.create_user(
            email='trainer@example.com',
            username='trainer',
            password='password123',
            role='trainer',
            email_verified=True
        )

    def test_client_can_access_client_profile(self):
        """Test client can access their own profile"""
        self.client_api.force_authenticate(user=self.client_user)
        url = reverse('users:client_profile')
        response = self.client_api.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'bio' in response.data

    def test_trainer_cannot_access_client_profile(self):
        """Test trainer cannot access client profile endpoint"""
        self.client_api.force_authenticate(user=self.trainer_user)
        url = reverse('users:client_profile')
        response = self.client_api.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_trainer_can_access_trainer_profile(self):
        """Test trainer can access their own profile"""
        self.client_api.force_authenticate(user=self.trainer_user)
        url = reverse('users:trainer_profile_update')
        response = self.client_api.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'bio' in response.data

    def test_client_cannot_access_trainer_profile_update(self):
        """Test client cannot access trainer profile update endpoint"""
        self.client_api.force_authenticate(user=self.client_user)
        url = reverse('users:trainer_profile_update')
        response = self.client_api.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access_profiles(self):
        """Test unauthenticated users cannot access protected profiles"""
        url = reverse('users:client_profile')
        response = self.client_api.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProfileCreation:
    """Test automatic profile creation on registration"""

    def setup_method(self):
        self.client = APIClient()

    def test_client_profile_created_on_registration(self):
        """Test ClientProfile is automatically created for client users"""
        user = User.objects.create_user(
            email='newclient@example.com',
            username='newclient',
            password='password123',
            role='client'
        )

        assert hasattr(user, 'client_profile')
        assert ClientProfile.objects.filter(user=user).exists()

    def test_trainer_profile_created_on_registration(self):
        """Test TrainerProfile is automatically created for trainer users"""
        user = User.objects.create_user(
            email='newtrainer@example.com',
            username='newtrainer',
            password='password123',
            role='trainer'
        )

        assert hasattr(user, 'trainer_profile')
        assert TrainerProfile.objects.filter(user=user).exists()

    def test_admin_no_profile_created(self):
        """Test no profile created for admin users"""
        user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='password123',
            role='admin'
        )

        # Admin users should not have profile models
        assert not ClientProfile.objects.filter(user=user).exists()
        assert not TrainerProfile.objects.filter(user=user).exists()


@pytest.mark.django_db
class TestProfileUpdate:
    """Test profile update functionality"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='password123',
            role='client',
            email_verified=True
        )
        self.url = reverse('users:client_profile')

    def test_update_client_profile(self):
        """Test client can update their profile"""
        self.client.force_authenticate(user=self.user)

        data = {
            'bio': 'I love fitness and travel!',
            'address': '123 Main St, San Francisco, CA'
        }
        response = self.client.patch(self.url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['bio'] == 'I love fitness and travel!'

        # Verify in database
        self.user.client_profile.refresh_from_db()
        assert self.user.client_profile.bio == 'I love fitness and travel!'

    def test_get_client_profile(self):
        """Test getting client profile"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_email'] == 'client@example.com'
        assert 'bio' in response.data
        assert 'address' in response.data


@pytest.mark.django_db
class TestTrainerProfilePublicView:
    """Test public trainer profile view"""

    def setup_method(self):
        self.client = APIClient()

        # Create verified trainer
        self.trainer_user = User.objects.create_user(
            email='trainer@example.com',
            username='trainer',
            password='password123',
            role='trainer',
            email_verified=True
        )
        self.trainer_user.trainer_profile.verified = True
        self.trainer_user.trainer_profile.bio = 'Experienced personal trainer'
        self.trainer_user.trainer_profile.save()

        # Create unverified trainer
        self.unverified_trainer = User.objects.create_user(
            email='unverified@example.com',
            username='unverified',
            password='password123',
            role='trainer'
        )

    def test_public_can_view_verified_trainer_profile(self):
        """Test anyone can view verified trainer profiles"""
        url = reverse('users:trainer_profile_detail', kwargs={'id': self.trainer_user.trainer_profile.id})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['bio'] == 'Experienced personal trainer'
        assert response.data['verified'] is True

    def test_unverified_trainer_not_publicly_visible(self):
        """Test unverified trainers are not visible in public endpoint"""
        url = reverse('users:trainer_profile_detail', kwargs={'id': self.unverified_trainer.trainer_profile.id})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUserSerializerWithProfile:
    """Test that UserSerializer includes profile data"""

    def setup_method(self):
        self.client = APIClient()

    def test_client_user_includes_profile_data(self):
        """Test client user serializer includes client profile"""
        user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='password123',
            role='client',
            email_verified=True
        )
        user.client_profile.bio = 'Fitness enthusiast'
        user.client_profile.save()

        self.client.force_authenticate(user=user)
        url = reverse('users:current_user')
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'profile' in response.data
        assert response.data['profile']['bio'] == 'Fitness enthusiast'

    def test_trainer_user_includes_profile_data(self):
        """Test trainer user serializer includes trainer profile"""
        user = User.objects.create_user(
            email='trainer@example.com',
            username='trainer',
            password='password123',
            role='trainer',
            email_verified=True
        )
        user.trainer_profile.bio = 'Certified trainer'
        user.trainer_profile.save()

        self.client.force_authenticate(user=user)
        url = reverse('users:current_user')
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'profile' in response.data
        assert response.data['profile']['bio'] == 'Certified trainer'

    def test_admin_user_no_profile(self):
        """Test admin user has no profile"""
        user = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='password123',
            role='admin',
            email_verified=True
        )

        self.client.force_authenticate(user=user)
        url = reverse('users:current_user')
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['profile'] is None
