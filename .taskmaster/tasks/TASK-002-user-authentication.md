# TASK-002: User Authentication System

**Epic:** Phase 1 - Sprint 1 (Week 1) - Foundation
**Complexity:** Large (8 hours)
**Dependencies:** TASK-001 (Project setup)
**Assignee:** Backend Developer
**Status:** Pending

---

## Overview

Implement complete user authentication system with registration, login, email verification, and password reset functionality. Support role-based access for Clients, Trainers, and Admins.

---

## Sub-Tasks

- [ ] 1. Create custom User model with role field
  - Extend Django AbstractUser
  - Add role choices (client, trainer, admin)
  - Add email_verified boolean field
  - Add phone number field

- [ ] 2. Set up Django REST Framework authentication
  - Install djangorestframework-simplejwt
  - Configure JWT settings
  - Create token obtain/refresh endpoints
  - Add authentication classes to DRF settings

- [ ] 3. Create user registration API endpoint
  - Build registration serializer with validation
  - Validate email uniqueness
  - Hash passwords securely
  - Send email verification token
  - Create User and Profile objects

- [ ] 4. Implement email verification flow
  - Generate email confirmation tokens
  - Create email verification endpoint
  - Send confirmation email with link
  - Mark user as verified on confirmation

- [ ] 5. Build login API endpoint
  - Validate credentials (email + password)
  - Check if email is verified
  - Return JWT tokens (access + refresh)
  - Return user data (id, email, role)

- [ ] 6. Implement password reset flow
  - Create "forgot password" endpoint (send reset email)
  - Generate password reset tokens
  - Create "reset password" endpoint (with token)
  - Expire tokens after 24 hours

- [ ] 7. Create user profile endpoints
  - GET /api/v1/users/me/ (current user profile)
  - PATCH /api/v1/users/me/ (update profile)
  - Add permissions (must be authenticated)

- [ ] 8. Write comprehensive tests
  - Test registration with valid/invalid data
  - Test email verification flow
  - Test login with verified/unverified email
  - Test password reset flow
  - Test JWT token generation and validation

---

## Implementation Guide

### Step 1: Create Custom User Model

**File: `backend/users/models.py`**
```python
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """Custom user model with role and email verification"""

    ROLE_CHOICES = [
        ('client', 'Client'),
        ('trainer', 'Trainer'),
        ('admin', 'Admin'),
    ]

    # Override email to make it required and unique
    email = models.EmailField(_('email address'), unique=True)

    # Add custom fields
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='client',
        help_text='User role in the system'
    )
    email_verified = models.BooleanField(
        default=False,
        help_text='True if user has verified their email address'
    )
    phone = models.CharField(max_length=20, blank=True)

    # Use email for authentication instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # username still required for createsuperuser

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return self.email


class EmailVerificationToken(models.Model):
    """Token for email verification"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        """Tokens expire after 24 hours"""
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(hours=24)


class PasswordResetToken(models.Model):
    """Token for password reset"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        """Tokens expire after 24 hours"""
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(hours=24)
```

**Update `backend/fitconnect/settings.py`:**
```python
# Set custom user model
AUTH_USER_MODEL = 'users.User'
```

**Run migrations:**
```bash
python manage.py makemigrations users
python manage.py migrate
```

### Step 2: Set Up JWT Authentication

**Install SimpleJWT:**
```bash
pip install djangorestframework-simplejwt
pip freeze > requirements.txt
```

**Update `backend/fitconnect/settings.py`:**
```python
from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}
```

### Step 3: Create Registration API

**File: `backend/users/serializers.py`**
```python
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'role', 'phone')
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }

    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        """Ensure passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=validated_data.get('role', 'client'),
            phone=validated_data.get('phone', ''),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'role', 'phone', 'email_verified', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'email_verified', 'date_joined')
```

**File: `backend/users/views.py`**
```python
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, EmailVerificationToken, PasswordResetToken
from .serializers import UserRegistrationSerializer, UserSerializer
import secrets


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate email verification token
        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.create(user=user, token=token)

        # TODO: Send verification email (implement in TASK-012)
        # For now, just return success message
        verification_url = f"http://localhost:3000/verify-email/{token}"

        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful. Please verify your email.',
            'verification_url': verification_url  # Remove in production, send via email
        }, status=status.HTTP_201_CREATED)


class EmailVerificationView(APIView):
    """Email verification endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token_str = request.data.get('token')
        if not token_str:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = EmailVerificationToken.objects.get(token=token_str)
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if token.is_expired():
            return Response(
                {'error': 'Token has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify user email
        user = token.user
        user.email_verified = True
        user.save()

        # Delete token after use
        token.delete()

        return Response({
            'message': 'Email verified successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').lower()
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if email is verified
        if not user.email_verified:
            return Response(
                {'error': 'Please verify your email before logging in'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    """Request password reset endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal that email doesn't exist (security)
            return Response({
                'message': 'If your email is registered, you will receive a password reset link.'
            }, status=status.HTTP_200_OK)

        # Generate password reset token
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)

        # TODO: Send reset email (implement in TASK-012)
        reset_url = f"http://localhost:3000/reset-password/{token}"

        return Response({
            'message': 'If your email is registered, you will receive a password reset link.',
            'reset_url': reset_url  # Remove in production, send via email
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Reset password with token endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token_str = request.data.get('token')
        new_password = request.data.get('password')

        if not token_str or not new_password:
            return Response(
                {'error': 'Token and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = PasswordResetToken.objects.get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if token.is_expired():
            return Response(
                {'error': 'Token has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset password
        user = token.user
        user.set_password(new_password)
        user.save()

        # Delete token after use
        token.delete()

        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)
```

**File: `backend/users/urls.py`** (create new file):
```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Registration and verification
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.EmailVerificationView.as_view(), name='verify_email'),

    # Login and token refresh
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Password reset
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),

    # Current user profile
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
]
```

**Update `backend/fitconnect/urls.py`:**
```python
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'message': 'FitConnect API is running',
        'version': '1.0.0'
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/v1/users/', include('users.urls')),  # Add this
]
```

### Step 8: Write Tests

**File: `backend/users/tests/test_auth.py`**
```python
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User, EmailVerificationToken


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
        response = self.client.post(self.url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert response.data['user']['email'] == 'test@example.com'
        assert User.objects.filter(email='test@example.com').exists()

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
        response = self.client.post(self.url, data)

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
        response = self.client.post(self.url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data


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

        response = self.client.post(self.url, {'token': 'test_token_123'})

        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.email_verified is True
        assert not EmailVerificationToken.objects.filter(token='test_token_123').exists()

    def test_verify_email_invalid_token(self):
        """Test verification with invalid token"""
        response = self.client.post(self.url, {'token': 'invalid_token'})

        assert response.status_code == status.HTTP_400_BAD_REQUEST


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
        response = self.client.post(self.url, data)

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
        response = self.client.post(self.url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_unverified_email(self):
        """Test login with unverified email"""
        self.user.email_verified = False
        self.user.save()

        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN
```

**Run tests:**
```bash
# Install pytest and dependencies
pip install pytest pytest-django
pip freeze > requirements.txt

# Create pytest.ini
echo "[pytest]
DJANGO_SETTINGS_MODULE = fitconnect.settings
python_files = tests.py test_*.py *_tests.py" > pytest.ini

# Run tests
pytest users/tests/test_auth.py -v
```

---

## Acceptance Criteria

- [x] Custom User model created with role field (client, trainer, admin)
- [x] Registration endpoint creates user with hashed password
- [x] Email verification token generated on registration
- [x] Email verification endpoint marks user as verified
- [x] Login endpoint returns JWT tokens (access + refresh)
- [x] Login blocked for unverified emails
- [x] Password reset flow generates token and allows password change
- [x] Current user profile endpoint requires authentication
- [x] All tests pass (registration, login, verification, password reset)
- [x] API responses follow consistent error format

---

## Test Cases

### Test 1: User Registration
```bash
curl -X POST http://localhost:8000/api/v1/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "client"
  }'

# Expected: 201 Created with user data and verification_url
```

### Test 2: Email Verification
```bash
curl -X POST http://localhost:8000/api/v1/users/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token_from_registration>"
  }'

# Expected: 200 OK with "Email verified successfully"
```

### Test 3: Login
```bash
curl -X POST http://localhost:8000/api/v1/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Expected: 200 OK with JWT tokens and user data
```

### Test 4: Access Protected Endpoint
```bash
curl http://localhost:8000/api/v1/users/me/ \
  -H "Authorization: Bearer <access_token>"

# Expected: 200 OK with current user data
```

### Test 5: Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/users/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<refresh_token>"
  }'

# Expected: 200 OK with new access token
```

---

## Next Steps

After completing TASK-002:
1. Proceed to **TASK-003**: User models and role-based access
2. Integrate frontend authentication (React context, protected routes)
3. Test full auth flow: register → verify → login → access protected route

---

**Estimated Time**: 8 hours
**Last Updated**: 2025-11-06
