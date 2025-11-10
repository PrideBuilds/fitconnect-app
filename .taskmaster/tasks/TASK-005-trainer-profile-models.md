# TASK-005: Trainer Profile Models

**Epic:** Phase 1 - Sprint 2 (Week 2) - Trainer Profiles
**Complexity:** Small (4 hours)
**Dependencies:** TASK-003 (User Models)
**Assignee:** Backend Developer
**Status:** Pending

---

## Overview

Expand the TrainerProfile model with complete fields including location (PostGIS), specializations, certifications, pricing, years of experience, and photo gallery. Create supporting models for specializations and certifications.

---

## Sub-Tasks

- [ ] 1. Create Specialization model
  - Common fitness specializations (Yoga, HIIT, Strength, etc.)
  - Slug field for URLs
  - Admin interface

- [ ] 2. Expand TrainerProfile model with full fields
  - PostGIS location field
  - Address and geocoded coordinates
  - Hourly rate and pricing
  - Years of experience
  - Certifications
  - Service radius
  - Average rating (cached)

- [ ] 3. Create TrainerPhoto model
  - Multiple photos per trainer
  - Ordering/sequence field
  - Caption field
  - Photo type (profile, gym, credentials)

- [ ] 4. Create TrainerCertification model
  - Certification name
  - Issuing organization
  - Issue/expiry dates
  - Document upload

- [ ] 5. Create database indexes
  - PostGIS spatial index on location
  - Index on verified status
  - Index on average rating

- [ ] 6. Create data migration with default specializations
  - Pre-populate common specializations
  - Create admin superuser can add more

- [ ] 7. Update serializers
  - Include nested specializations
  - Include photos
  - Include certifications
  - Distance calculation in search results

- [ ] 8. Write model tests
  - Test profile creation
  - Test relationships
  - Test rating calculation
  - Test location queries

---

## Implementation Guide

### Step 1: Create Specialization Model

**Create new app:**
```bash
cd backend
python manage.py startapp trainers
```

**Update `backend/fitconnect/settings.py`:**
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'trainers',  # Add this
]
```

**File: `backend/trainers/models.py`**:
```python
from django.db import models
from django.utils.text import slugify
from django.contrib.gis.db import models as gis_models
from django.core.validators import MinValueValidator, MaxValueValidator


class Specialization(models.Model):
    """Fitness specialization/category"""

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(max_length=200, blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or icon class")

    class Meta:
        ordering = ['name']
        verbose_name = 'specialization'
        verbose_name_plural = 'specializations'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class TrainerProfile(models.Model):
    """Complete trainer profile with location and qualifications"""

    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='trainer_profile'
    )

    # Basic Info
    bio = models.TextField(
        max_length=500,
        help_text="Tell clients about your training philosophy"
    )
    years_experience = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(50)]
    )

    # Location (PostGIS)
    address = models.CharField(max_length=255)
    location = gis_models.PointField(
        geography=True,
        help_text="Geocoded coordinates from address"
    )
    service_radius_miles = models.IntegerField(
        default=10,
        help_text="How far trainer will travel to clients"
    )

    # Pricing
    hourly_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Specializations
    specializations = models.ManyToManyField(
        Specialization,
        related_name='trainers',
        help_text="Fitness specializations (Yoga, HIIT, etc.)"
    )

    # Verification & Rating
    verified = models.BooleanField(
        default=False,
        help_text="Background check completed"
    )
    verification_expires = models.DateField(
        null=True,
        blank=True,
        help_text="Verification expires 12 months after completion"
    )
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    total_reviews = models.IntegerField(default=0)

    # Profile Status
    profile_complete = models.BooleanField(
        default=False,
        help_text="Profile has all required fields"
    )
    published = models.BooleanField(
        default=False,
        help_text="Profile visible in search"
    )

    # SEO
    slug = models.SlugField(unique=True, max_length=100, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'trainer profile'
        verbose_name_plural = 'trainer profiles'
        indexes = [
            gis_models.Index(fields=['location']),
            models.Index(fields=['verified', 'published']),
            models.Index(fields=['average_rating']),
        ]

    def __str__(self):
        return f"{self.user.email} - Trainer"

    def save(self, *args, **kwargs):
        # Auto-generate slug from username and city
        if not self.slug:
            from django.contrib.gis.geos import Point
            city = "trainer"  # Parse from address or default
            base_slug = slugify(f"{self.user.username}-{city}")
            self.slug = base_slug

            # Ensure uniqueness
            counter = 1
            while TrainerProfile.objects.filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1

        super().save(*args, **kwargs)

    def check_profile_complete(self):
        """Check if profile has all required fields"""
        required_checks = [
            bool(self.bio),
            bool(self.address),
            bool(self.location),
            self.hourly_rate > 0,
            self.specializations.exists(),
            self.photos.filter(photo_type='profile').exists(),
        ]
        self.profile_complete = all(required_checks)
        return self.profile_complete


class TrainerPhoto(models.Model):
    """Photos for trainer profile"""

    PHOTO_TYPE_CHOICES = [
        ('profile', 'Profile Photo'),
        ('gym', 'Training Space'),
        ('credentials', 'Certifications'),
        ('action', 'Training Sessions'),
    ]

    trainer = models.ForeignKey(
        TrainerProfile,
        on_delete=models.CASCADE,
        related_name='photos'
    )
    photo = models.ImageField(upload_to='trainers/photos/')
    photo_type = models.CharField(max_length=20, choices=PHOTO_TYPE_CHOICES, default='gym')
    caption = models.CharField(max_length=100, blank=True)
    order = models.IntegerField(default=0, help_text="Display order (lower first)")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = 'trainer photo'
        verbose_name_plural = 'trainer photos'

    def __str__(self):
        return f"{self.trainer.user.username} - {self.photo_type}"


class TrainerCertification(models.Model):
    """Professional certifications and credentials"""

    trainer = models.ForeignKey(
        TrainerProfile,
        on_delete=models.CASCADE,
        related_name='certifications'
    )
    name = models.CharField(
        max_length=100,
        help_text="e.g., 'NASM Certified Personal Trainer'"
    )
    issuing_organization = models.CharField(max_length=100)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(
        null=True,
        blank=True,
        help_text="Leave blank if no expiry"
    )
    credential_id = models.CharField(max_length=100, blank=True)
    document = models.FileField(
        upload_to='trainers/certifications/',
        blank=True,
        help_text="Upload certification document (PDF or image)"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issue_date']
        verbose_name = 'trainer certification'
        verbose_name_plural = 'trainer certifications'

    def __str__(self):
        return f"{self.trainer.user.username} - {self.name}"

    def is_expired(self):
        """Check if certification is expired"""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.expiry_date
```

### Step 2: Create Admin Interface

**File: `backend/trainers/admin.py`**:
```python
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Specialization, TrainerProfile, TrainerPhoto, TrainerCertification


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


class TrainerPhotoInline(admin.TabularInline):
    model = TrainerPhoto
    extra = 1
    fields = ('photo', 'photo_type', 'caption', 'order')


class TrainerCertificationInline(admin.TabularInline):
    model = TrainerCertification
    extra = 1
    fields = ('name', 'issuing_organization', 'issue_date', 'expiry_date')


@admin.register(TrainerProfile)
class TrainerProfileAdmin(GISModelAdmin):
    list_display = (
        'user',
        'verified',
        'published',
        'average_rating',
        'hourly_rate',
        'created_at'
    )
    list_filter = ('verified', 'published', 'specializations')
    search_fields = ('user__email', 'user__username', 'address')
    readonly_fields = ('average_rating', 'total_reviews', 'slug', 'created_at', 'updated_at')
    inlines = [TrainerPhotoInline, TrainerCertificationInline]

    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Basic Info', {
            'fields': ('bio', 'years_experience', 'specializations')
        }),
        ('Location', {
            'fields': ('address', 'location', 'service_radius_miles')
        }),
        ('Pricing', {
            'fields': ('hourly_rate',)
        }),
        ('Verification & Rating', {
            'fields': ('verified', 'verification_expires', 'average_rating', 'total_reviews')
        }),
        ('Profile Status', {
            'fields': ('profile_complete', 'published', 'slug')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
```

### Step 3: Create Data Migration for Specializations

**Run makemigrations first:**
```bash
python manage.py makemigrations trainers
python manage.py migrate
```

**Create data migration:**
```bash
python manage.py makemigrations trainers --empty --name populate_specializations
```

**Edit the migration file** (`backend/trainers/migrations/000X_populate_specializations.py`):
```python
from django.db import migrations


def populate_specializations(apps, schema_editor):
    """Populate default fitness specializations"""
    Specialization = apps.get_model('trainers', 'Specialization')

    specializations = [
        {'name': 'Strength Training', 'icon': '💪', 'description': 'Build muscle and increase strength'},
        {'name': 'Yoga', 'icon': '🧘', 'description': 'Flexibility, balance, and mindfulness'},
        {'name': 'HIIT', 'icon': '🔥', 'description': 'High-intensity interval training'},
        {'name': 'Cardio', 'icon': '🏃', 'description': 'Cardiovascular endurance training'},
        {'name': 'Pilates', 'icon': '🤸', 'description': 'Core strength and flexibility'},
        {'name': 'CrossFit', 'icon': '🏋️', 'description': 'Functional fitness and conditioning'},
        {'name': 'Boxing', 'icon': '🥊', 'description': 'Boxing technique and fitness'},
        {'name': 'Cycling', 'icon': '🚴', 'description': 'Indoor and outdoor cycling'},
        {'name': 'Running', 'icon': '🏃‍♀️', 'description': 'Running technique and endurance'},
        {'name': 'Nutrition', 'icon': '🥗', 'description': 'Diet and nutrition coaching'},
        {'name': 'Weight Loss', 'icon': '⚖️', 'description': 'Weight management and fat loss'},
        {'name': 'Sports Performance', 'icon': '⚽', 'description': 'Sport-specific training'},
        {'name': 'Rehabilitation', 'icon': '🩹', 'description': 'Injury recovery and prevention'},
        {'name': 'Senior Fitness', 'icon': '👴', 'description': 'Fitness for older adults'},
        {'name': 'Prenatal/Postnatal', 'icon': '🤰', 'description': 'Training for pregnancy'},
    ]

    for spec_data in specializations:
        Specialization.objects.get_or_create(
            name=spec_data['name'],
            defaults={
                'icon': spec_data['icon'],
                'description': spec_data['description']
            }
        )


def reverse_populate(apps, schema_editor):
    """Remove seeded specializations"""
    Specialization = apps.get_model('trainers', 'Specialization')
    Specialization.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('trainers', '0001_initial'),  # Adjust to your actual migration number
    ]

    operations = [
        migrations.RunPython(populate_specializations, reverse_populate),
    ]
```

**Run migration:**
```bash
python manage.py migrate
```

### Step 4: Create Serializers

**File: `backend/trainers/serializers.py`** (create new file):
```python
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Specialization, TrainerProfile, TrainerPhoto, TrainerCertification


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ('id', 'name', 'slug', 'icon', 'description')


class TrainerPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerPhoto
        fields = ('id', 'photo', 'photo_type', 'caption', 'order')


class TrainerCertificationSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = TrainerCertification
        fields = (
            'id',
            'name',
            'issuing_organization',
            'issue_date',
            'expiry_date',
            'credential_id',
            'document',
            'is_expired'
        )


class TrainerProfileSerializer(serializers.ModelSerializer):
    """Detailed trainer profile serializer"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    specialization_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Specialization.objects.all(),
        source='specializations'
    )
    photos = TrainerPhotoSerializer(many=True, read_only=True)
    certifications = TrainerCertificationSerializer(many=True, read_only=True)

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'user_email',
            'user_name',
            'bio',
            'years_experience',
            'address',
            'location',
            'service_radius_miles',
            'hourly_rate',
            'specializations',
            'specialization_ids',
            'photos',
            'certifications',
            'verified',
            'verification_expires',
            'average_rating',
            'total_reviews',
            'profile_complete',
            'published',
            'slug',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'verified',
            'verification_expires',
            'average_rating',
            'total_reviews',
            'profile_complete',
            'slug',
            'created_at',
            'updated_at',
        )


class TrainerProfileListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search results"""

    user_name = serializers.CharField(source='user.username', read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    profile_photo = serializers.SerializerMethodField()
    distance_miles = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
        required=False
    )

    class Meta:
        model = TrainerProfile
        fields = (
            'id',
            'slug',
            'user_name',
            'bio',
            'years_experience',
            'hourly_rate',
            'specializations',
            'profile_photo',
            'verified',
            'average_rating',
            'total_reviews',
            'distance_miles',
        )

    def get_profile_photo(self, obj):
        """Return first profile photo URL"""
        photo = obj.photos.filter(photo_type='profile').first()
        if photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(photo.photo.url)
        return None
```

### Step 5: Write Tests

**File: `backend/trainers/tests/test_models.py`** (create tests directory):
```python
import pytest
from django.contrib.gis.geos import Point
from users.models import User
from trainers.models import (
    Specialization,
    TrainerProfile,
    TrainerPhoto,
    TrainerCertification
)


@pytest.mark.django_db
class TestTrainerProfile:
    """Test trainer profile model"""

    def setup_method(self):
        self.user = User.objects.create_user(
            email='trainer@test.com',
            username='testtrainer',
            password='password123',
            role='trainer'
        )

        self.spec1 = Specialization.objects.create(name='Yoga')
        self.spec2 = Specialization.objects.create(name='HIIT')

    def test_create_trainer_profile(self):
        """Test creating a complete trainer profile"""
        profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Experienced yoga instructor",
            years_experience=5,
            address="123 Main St, San Francisco, CA",
            location=Point(-122.4194, 37.7749),  # SF coordinates
            hourly_rate=75.00,
        )
        profile.specializations.add(self.spec1, self.spec2)

        assert profile.user == self.user
        assert profile.hourly_rate == 75.00
        assert profile.specializations.count() == 2

    def test_slug_auto_generated(self):
        """Test that slug is auto-generated"""
        profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )

        assert profile.slug
        assert 'testtrainer' in profile.slug

    def test_profile_complete_check(self):
        """Test profile completeness validation"""
        profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )
        profile.specializations.add(self.spec1)

        # Add profile photo
        TrainerPhoto.objects.create(
            trainer=profile,
            photo='trainers/photos/test.jpg',
            photo_type='profile'
        )

        is_complete = profile.check_profile_complete()

        assert is_complete is True
        profile.save()
        assert profile.profile_complete is True


@pytest.mark.django_db
class TestSpecialization:
    """Test specialization model"""

    def test_create_specialization(self):
        """Test creating a specialization"""
        spec = Specialization.objects.create(
            name='Strength Training',
            icon='💪',
            description='Build muscle'
        )

        assert spec.name == 'Strength Training'
        assert spec.slug == 'strength-training'  # Auto-slugified

    def test_slug_uniqueness(self):
        """Test that slugs are unique"""
        Specialization.objects.create(name='Yoga')

        with pytest.raises(Exception):  # IntegrityError
            Specialization.objects.create(name='Yoga')
```

---

## Acceptance Criteria

- [x] Specialization model created with 15+ default specializations seeded
- [x] TrainerProfile model has all fields (location, pricing, bio, experience)
- [x] PostGIS location field with spatial index created
- [x] TrainerPhoto model supports multiple photos per trainer
- [x] TrainerCertification model stores credentials
- [x] Profile slug auto-generated from username
- [x] Admin interface displays all models with inlines
- [x] Serializers include nested relationships
- [x] All tests pass

---

## Test Cases

### Test 1: Create Trainer Profile via Django Shell
```python
python manage.py shell

>>> from django.contrib.gis.geos import Point
>>> from users.models import User
>>> from trainers.models import TrainerProfile, Specialization

>>> user = User.objects.get(email='trainer@test.com')
>>> yoga = Specialization.objects.get(name='Yoga')

>>> profile = TrainerProfile.objects.create(
...     user=user,
...     bio="Certified yoga instructor with 10 years experience",
...     years_experience=10,
...     address="San Francisco, CA",
...     location=Point(-122.4194, 37.7749),
...     hourly_rate=85.00
... )
>>> profile.specializations.add(yoga)
>>> profile.slug
'trainer-san-francisco'  # or similar
```

### Test 2: Check Default Specializations
```bash
python manage.py shell

>>> from trainers.models import Specialization
>>> Specialization.objects.count()
15
>>> list(Specialization.objects.values_list('name', flat=True))
['Yoga', 'HIIT', 'Strength Training', ...]
```

### Test 3: Run Model Tests
```bash
pytest trainers/tests/test_models.py -v
```

---

## Next Steps

After completing TASK-005:
1. Proceed to **TASK-006**: Profile creation form with photo uploads
2. Proceed to **TASK-007**: Google Geocoding API integration
3. Test complete profile creation flow in Django admin

---

**Estimated Time**: 4 hours
**Last Updated**: 2025-11-06
