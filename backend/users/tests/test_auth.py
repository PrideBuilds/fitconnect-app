import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User, EmailVerificationToken, PasswordResetToken


@pytest.mark.django_db
class TestUserRegistration:
    """Test user registration endpoint"""

    def setup_method(self):
        self.client = APIClient()
        self.url = reverse('users:register')

    def test_register_valid_user(self):
        """Test registration with valid data"""
        data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'role': 'client'
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert response.data['user']['email'] == 'test@example.com'
        assert User.objects.filter(email='test@example.com').exists()
        # Check verification token was created
        user = User.objects.get(email='test@example.com')
        assert EmailVerificationToken.objects.filter(user=user).exists()

    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user(
            email='test@example.com',
            username='existing',
            password='password123'
        )

        data = {
            'email': 'test@example.com',
            'username': 'newuser',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data

    def test_register_password_mismatch(self):
        """Test registration with password mismatch"""
        data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_confirm': 'DifferentPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data

    def test_register_missing_fields(self):
        """Test registration with missing required fields"""
        data = {
            'email': 'test@example.com',
            # Missing username and passwords
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_email(self):
        """Test registration with invalid email"""
        data = {
            'email': 'invalid-email',
            'username': 'testuser',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEmailVerification:
    """Test email verification flow"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='password123',
            email_verified=False
        )
        self.url = reverse('users:verify_email')

    def test_verify_email_success(self):
        """Test successful email verification"""
        token = EmailVerificationToken.objects.create(
            user=self.user,
            token='test_token_123'
        )

        response = self.client.post(self.url, {'token': 'test_token_123'}, format='json')

        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.email_verified is True
        assert not EmailVerificationToken.objects.filter(token='test_token_123').exists()

    def test_verify_email_invalid_token(self):
        """Test verification with invalid token"""
        response = self.client.post(self.url, {'token': 'invalid_token'}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_verify_email_missing_token(self):
        """Test verification without providing token"""
        response = self.client.post(self.url, {}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_verify_email_expired_token(self):
        """Test verification with expired token"""
        from django.utils import timezone
        from datetime import timedelta

        token = EmailVerificationToken.objects.create(
            user=self.user,
            token='expired_token'
        )
        # Manually set created_at to 25 hours ago
        token.created_at = timezone.now() - timedelta(hours=25)
        token.save()

        response = self.client.post(self.url, {'token': 'expired_token'}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'expired' in response.data['error'].lower()


@pytest.mark.django_db
class TestUserLogin:
    """Test user login endpoint"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            email_verified=True
        )
        self.url = reverse('users:login')

    def test_login_success(self):
        """Test successful login"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        assert response.data['user']['email'] == 'test@example.com'

    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword!'
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'error' in response.data

    def test_login_nonexistent_email(self):
        """Test login with non-existent email"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_unverified_email(self):
        """Test login with unverified email"""
        self.user.email_verified = False
        self.user.save()

        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'verify' in response.data['error'].lower()

    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = self.client.post(self.url, {'email': 'test@example.com'}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_case_insensitive_email(self):
        """Test login with uppercase email (should be case-insensitive)"""
        data = {
            'email': 'TEST@EXAMPLE.COM',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPasswordReset:
    """Test password reset flow"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='OldPass123!',
            email_verified=True
        )
        self.forgot_url = reverse('users:forgot_password')
        self.reset_url = reverse('users:reset_password')

    def test_forgot_password_existing_user(self):
        """Test forgot password for existing user"""
        data = {'email': 'test@example.com'}
        response = self.client.post(self.forgot_url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        # Check token was created
        assert PasswordResetToken.objects.filter(user=self.user).exists()

    def test_forgot_password_nonexistent_user(self):
        """Test forgot password for non-existent user (should not reveal)"""
        data = {'email': 'nonexistent@example.com'}
        response = self.client.post(self.forgot_url, data, format='json')

        # Should return success to not reveal if email exists
        assert response.status_code == status.HTTP_200_OK

    def test_reset_password_success(self):
        """Test successful password reset"""
        token = PasswordResetToken.objects.create(
            user=self.user,
            token='reset_token_123'
        )

        data = {
            'token': 'reset_token_123',
            'password': 'NewPass123!'
        }
        response = self.client.post(self.reset_url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        # Check password was changed
        self.user.refresh_from_db()
        assert self.user.check_password('NewPass123!')
        # Check token was deleted
        assert not PasswordResetToken.objects.filter(token='reset_token_123').exists()

    def test_reset_password_invalid_token(self):
        """Test password reset with invalid token"""
        data = {
            'token': 'invalid_token',
            'password': 'NewPass123!'
        }
        response = self.client.post(self.reset_url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_reset_password_missing_fields(self):
        """Test password reset with missing fields"""
        response = self.client.post(self.reset_url, {'token': 'some_token'}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestCurrentUserView:
    """Test current user profile endpoint"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            email_verified=True
        )
        self.url = reverse('users:current_user')

    def test_get_current_user_authenticated(self):
        """Test getting current user when authenticated"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'test@example.com'
        assert response.data['id'] == self.user.id

    def test_get_current_user_unauthenticated(self):
        """Test getting current user when not authenticated"""
        response = self.client.get(self.url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_current_user(self):
        """Test updating current user profile"""
        self.client.force_authenticate(user=self.user)
        data = {
            'username': 'updated_username',
            'phone': '+1234567890'
        }
        response = self.client.patch(self.url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.username == 'updated_username'
        assert self.user.phone == '+1234567890'


@pytest.mark.django_db
class TestTokenRefresh:
    """Test JWT token refresh endpoint"""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            email_verified=True
        )
        self.url = reverse('users:token_refresh')

    def test_refresh_token_success(self):
        """Test successful token refresh"""
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(self.user)

        data = {'refresh': str(refresh)}
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    def test_refresh_token_invalid(self):
        """Test token refresh with invalid token"""
        data = {'refresh': 'invalid_token'}
        response = self.client.post(self.url, data, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
