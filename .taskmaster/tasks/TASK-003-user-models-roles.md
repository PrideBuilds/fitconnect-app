# TASK-003: User Models and Role-Based Access

**Epic:** Phase 1 - Sprint 1 (Week 1) - Foundation
**Complexity:** Small (4 hours)
**Dependencies:** TASK-002 (User Authentication)
**Assignee:** Backend Developer
**Status:** Pending

---

## Overview

Extend the User model with profile information and implement role-based permissions for Clients, Trainers, and Admins. Create separate profile models for different user types and set up Django REST Framework permissions.

---

## Sub-Tasks

- [ ] 1. Create ClientProfile model
  - Fields: preferred specializations, location, bio
  - OneToOne relationship with User
  - Auto-creation on client registration

- [ ] 2. Create TrainerProfile model (basic structure)
  - Will be fully expanded in TASK-005
  - Basic fields for now: bio, verified status
  - OneToOne relationship with User

- [ ] 3. Create custom DRF permission classes
  - IsClient permission
  - IsTrainer permission
  - IsAdmin permission
  - IsOwnerOrReadOnly permission

- [ ] 4. Update user registration to create profiles
  - Automatic profile creation based on role
  - Signal-based profile creation
  - Handle profile creation in serializer

- [ ] 5. Create profile API endpoints
  - GET /api/v1/profiles/client/
  - PATCH /api/v1/profiles/client/
  - GET /api/v1/profiles/trainer/{id}/
  - Apply appropriate permissions

- [ ] 6. Write tests for permissions
  - Test role-based access control
  - Test profile creation on registration
  - Test permission classes on endpoints

---

## Implementation Guide

### Step 1: Create ClientProfile Model

**File: `backend/users/models.py`** (add to existing file):
```python
from django.contrib.gis.db import models as gis_models

class ClientProfile(models.Model):
    """Profile for clients looking for trainers"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='client_profile'
    )
    bio = models.TextField(max_length=500, blank=True)
    location = gis_models.PointField(geography=True, null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)
    profile_photo = models.ImageField(upload_to='clients/photos/', blank=True)

    # Preferences
    preferred_specializations = models.ManyToManyField(
        'trainers.Specialization',
        blank=True,
        related_name='interested_clients'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'client profile'
        verbose_name_plural = 'client profiles'

    def __str__(self):
        return f"{self.user.email} - Client Profile"


class TrainerProfile(models.Model):
    """Profile for trainers (basic structure for now, expanded in TASK-005)"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='trainer_profile'
    )
    bio = models.TextField(max_length=500, blank=True)
    verified = models.BooleanField(default=False)
    profile_photo = models.ImageField(upload_to='trainers/photos/', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'trainer profile'
        verbose_name_plural = 'trainer profiles'

    def __str__(self):
        return f"{self.user.email} - Trainer Profile"
```

**Update `backend/users/admin.py`:**
```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ClientProfile, TrainerProfile

class ClientProfileInline(admin.StackedInline):
    model = ClientProfile
    can_delete = False
    verbose_name_plural = 'Client Profile'
    fk_name = 'user'

class TrainerProfileInline(admin.StackedInline):
    model = TrainerProfile
    can_delete = False
    verbose_name_plural = 'Trainer Profile'
    fk_name = 'user'

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'email_verified', 'is_staff', 'date_joined')
    list_filter = ('role', 'email_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'email_verified', 'phone')}),
    )

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        inlines = []
        if obj.role == 'client' and hasattr(obj, 'client_profile'):
            inlines.append(ClientProfileInline(self.model, self.admin_site))
        elif obj.role == 'trainer' and hasattr(obj, 'trainer_profile'):
            inlines.append(TrainerProfileInline(self.model, self.admin_site))
        return inlines

admin.site.unregister(User)  # Unregister if already registered
admin.site.register(User, UserAdmin)
admin.site.register(ClientProfile)
admin.site.register(TrainerProfile)
```

**Run migrations:**
```bash
python manage.py makemigrations users
python manage.py migrate
```

### Step 2: Create Custom Permission Classes

**File: `backend/users/permissions.py`** (create new file):
```python
from rest_framework import permissions


class IsClient(permissions.BasePermission):
    """
    Permission to only allow clients to access a view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'


class IsTrainer(permissions.BasePermission):
    """
    Permission to only allow trainers to access a view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'trainer'


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admins to access a view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit their profile.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        # obj.user is the User instance from profile
        return obj.user == request.user


class IsClientOrTrainer(permissions.BasePermission):
    """
    Permission to allow both clients and trainers.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['client', 'trainer']
        )
```

### Step 3: Auto-Create Profiles on Registration

**File: `backend/users/signals.py`** (create new file):
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, ClientProfile, TrainerProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create appropriate profile when user is created based on role.
    """
    if created:
        if instance.role == 'client':
            ClientProfile.objects.create(user=instance)
        elif instance.role == 'trainer':
            TrainerProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save profile when user is saved.
    """
    if instance.role == 'client' and hasattr(instance, 'client_profile'):
        instance.client_profile.save()
    elif instance.role == 'trainer' and hasattr(instance, 'trainer_profile'):
        instance.trainer_profile.save()
```

**File: `backend/users/apps.py`** (update to load signals):
```python
from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        import users.signals  # Load signals
```

**Ensure app config is used in `backend/users/__init__.py`:**
```python
default_app_config = 'users.apps.UsersConfig'
```

### Step 4: Create Profile Serializers

**File: `backend/users/serializers.py`** (add to existing file):
```python
from .models import ClientProfile, TrainerProfile


class ClientProfileSerializer(serializers.ModelSerializer):
    """Serializer for client profile"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ClientProfile
        fields = (
            'id',
            'user_email',
            'user_name',
            'bio',
            'address',
            'location',
            'profile_photo',
            'preferred_specializations',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class TrainerProfileSerializer(serializers.ModelSerializer):
    """Serializer for trainer profile (basic for now)"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'user_email',
            'user_name',
            'bio',
            'verified',
            'profile_photo',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'verified', 'created_at', 'updated_at')


# Update UserSerializer to include profile data
class UserSerializer(serializers.ModelSerializer):
    """Enhanced user serializer with profile data"""

    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'role',
            'phone',
            'email_verified',
            'date_joined',
            'profile',
        )
        read_only_fields = ('id', 'email', 'role', 'email_verified', 'date_joined')

    def get_profile(self, obj):
        """Return appropriate profile based on user role"""
        if obj.role == 'client' and hasattr(obj, 'client_profile'):
            return ClientProfileSerializer(obj.client_profile).data
        elif obj.role == 'trainer' and hasattr(obj, 'trainer_profile'):
            return TrainerProfileSerializer(obj.trainer_profile).data
        return None
```

### Step 5: Create Profile API Views

**File: `backend/users/views.py`** (add to existing file):
```python
from .models import ClientProfile, TrainerProfile
from .serializers import ClientProfileSerializer, TrainerProfileSerializer
from .permissions import IsClient, IsTrainer, IsOwnerOrReadOnly


class ClientProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current client's profile"""

    permission_classes = (permissions.IsAuthenticated, IsClient)
    serializer_class = ClientProfileSerializer

    def get_object(self):
        # Return the client profile for the current user
        profile, created = ClientProfile.objects.get_or_create(user=self.request.user)
        return profile


class TrainerProfileDetailView(generics.RetrieveAPIView):
    """Public view of trainer profile"""

    permission_classes = (permissions.AllowAny,)
    serializer_class = TrainerProfileSerializer
    queryset = TrainerProfile.objects.filter(verified=True)
    lookup_field = 'id'


class TrainerProfileUpdateView(generics.RetrieveUpdateAPIView):
    """Trainer can update their own profile"""

    permission_classes = (permissions.IsAuthenticated, IsTrainer)
    serializer_class = TrainerProfileSerializer

    def get_object(self):
        # Return the trainer profile for the current user
        profile, created = TrainerProfile.objects.get_or_create(user=self.request.user)
        return profile
```

**Update `backend/users/urls.py`:**
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

    # Profile endpoints
    path('profiles/client/', views.ClientProfileView.as_view(), name='client_profile'),
    path('profiles/trainer/me/', views.TrainerProfileUpdateView.as_view(), name='trainer_profile_update'),
    path('profiles/trainer/<int:id>/', views.TrainerProfileDetailView.as_view(), name='trainer_profile_detail'),
]
```

### Step 6: Write Tests

**File: `backend/users/tests/test_permissions.py`** (create new file):
```python
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

        assert not hasattr(user, 'client_profile')
        assert not hasattr(user, 'trainer_profile')


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
        response = self.client.patch(self.url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['bio'] == 'I love fitness and travel!'

        # Verify in database
        self.user.client_profile.refresh_from_db()
        assert self.user.client_profile.bio == 'I love fitness and travel!'
```

**Run tests:**
```bash
pytest users/tests/test_permissions.py -v
```

---

## Acceptance Criteria

- [x] ClientProfile model created with bio, location, preferences
- [x] TrainerProfile model created (basic structure)
- [x] Profiles automatically created on user registration based on role
- [x] Custom permission classes (IsClient, IsTrainer, IsAdmin) work correctly
- [x] Client can access and update their profile via API
- [x] Trainer can access and update their profile via API
- [x] Role-based access control prevents unauthorized access
- [x] All tests pass (permissions, profile creation, updates)
- [x] Django admin shows profiles inline with users

---

## Test Cases

### Test 1: Register Client and Check Profile
```bash
# Register a client
curl -X POST http://localhost:8000/api/v1/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "username": "testclient",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "role": "client"
  }'

# Verify email (get token from response)
curl -X POST http://localhost:8000/api/v1/users/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{"token": "<token>"}'

# Login
curl -X POST http://localhost:8000/api/v1/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "TestPass123!"
  }'

# Access client profile
curl http://localhost:8000/api/v1/users/profiles/client/ \
  -H "Authorization: Bearer <access_token>"

# Expected: 200 OK with client profile data
```

### Test 2: Update Client Profile
```bash
curl -X PATCH http://localhost:8000/api/v1/users/profiles/client/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Traveling fitness enthusiast",
    "address": "San Francisco, CA"
  }'

# Expected: 200 OK with updated profile
```

### Test 3: Role-Based Access Control
```bash
# Login as trainer
curl -X POST http://localhost:8000/api/v1/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@test.com",
    "password": "TestPass123!"
  }'

# Try to access client profile endpoint (should fail)
curl http://localhost:8000/api/v1/users/profiles/client/ \
  -H "Authorization: Bearer <trainer_access_token>"

# Expected: 403 Forbidden
```

### Test 4: Check Profile Auto-Creation in Django Shell
```python
python manage.py shell

>>> from users.models import User, ClientProfile
>>> user = User.objects.get(email='client@test.com')
>>> user.role
'client'
>>> hasattr(user, 'client_profile')
True
>>> user.client_profile
<ClientProfile: client@test.com - Client Profile>
```

---

## Troubleshooting

### Issue: Profile not created automatically
**Solution**: Ensure signals are loaded
```python
# In users/apps.py
def ready(self):
    import users.signals
```

### Issue: "RelatedObjectDoesNotExist" error
**Solution**: Profile might not exist for existing users. Create manually:
```python
from users.models import User, ClientProfile, TrainerProfile

for user in User.objects.filter(role='client'):
    ClientProfile.objects.get_or_create(user=user)

for user in User.objects.filter(role='trainer'):
    TrainerProfile.objects.get_or_create(user=user)
```

### Issue: Permission denied on profile endpoints
**Solution**: Verify JWT token is valid and user role matches endpoint
```bash
# Decode JWT to check role
import jwt
token = "your_access_token"
decoded = jwt.decode(token, options={"verify_signature": False})
print(decoded)
```

---

## Next Steps

After completing TASK-003:
1. Proceed to **TASK-004**: Basic frontend layout and navigation
2. Proceed to **TASK-005**: Expand TrainerProfile with full fields (location, specializations, pricing)
3. Test profile creation flow end-to-end (register → verify → login → view profile)

---

## Resources

- Django Signals: https://docs.djangoproject.com/en/5.0/topics/signals/
- DRF Permissions: https://www.django-rest-framework.org/api-guide/permissions/
- PostGIS with Django: https://docs.djangoproject.com/en/5.0/ref/contrib/gis/

---

**Estimated Time**: 4 hours
**Last Updated**: 2025-11-06
