import pytest
from django.contrib.gis.geos import Point
from datetime import date, timedelta
from users.models import User
from trainers.models import (
    Specialization,
    TrainerProfile,
    TrainerPhoto,
    TrainerCertification
)


@pytest.mark.django_db
class TestSpecialization:
    """Test specialization model"""

    def test_create_specialization(self):
        """Test creating a specialization"""
        spec = Specialization.objects.create(
            name='Test Training',
            icon='💪',
            description='Build muscle'
        )

        assert spec.name == 'Test Training'
        assert spec.slug == 'test-training'  # Auto-slugified
        assert spec.icon == '💪'

    def test_specialization_str(self):
        """Test string representation"""
        spec = Specialization.objects.create(name='Yoga')
        assert str(spec) == 'Yoga'


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

        self.spec1 = Specialization.objects.create(name='Test Yoga')
        self.spec2 = Specialization.objects.create(name='Test HIIT')

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
        assert profile.years_experience == 5

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

    def test_slug_uniqueness(self):
        """Test that slugs are unique when same address"""
        profile1 = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )

        # Create another user with different username
        user2 = User.objects.create_user(
            email='trainer2@test.com',
            username='testtrainer2',
            password='password123',
            role='trainer'
        )

        profile2 = TrainerProfile.objects.create(
            user=user2,
            bio="Test bio",
            address="San Francisco, CA",  # Same city
            location=Point(-122.4194, 37.7749),
            hourly_rate=60.00,
        )

        # Slugs should be different due to different usernames
        assert profile1.slug != profile2.slug
        assert 'testtrainer' in profile1.slug
        assert 'testtrainer2' in profile2.slug

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

    def test_profile_incomplete_without_photo(self):
        """Test profile incomplete without profile photo"""
        profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )
        profile.specializations.add(self.spec1)

        is_complete = profile.check_profile_complete()

        assert is_complete is False

    def test_trainer_profile_str(self):
        """Test string representation"""
        profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )
        assert str(profile) == "trainer@test.com - Trainer"


@pytest.mark.django_db
class TestTrainerPhoto:
    """Test trainer photo model"""

    def setup_method(self):
        self.user = User.objects.create_user(
            email='trainer@test.com',
            username='testtrainer',
            password='password123',
            role='trainer'
        )
        self.profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )

    def test_create_trainer_photo(self):
        """Test creating trainer photo"""
        photo = TrainerPhoto.objects.create(
            trainer=self.profile,
            photo='trainers/photos/test.jpg',
            photo_type='profile',
            caption='Profile photo',
            order=1
        )

        assert photo.trainer == self.profile
        assert photo.photo_type == 'profile'
        assert photo.caption == 'Profile photo'
        assert photo.order == 1

    def test_trainer_photo_str(self):
        """Test string representation"""
        photo = TrainerPhoto.objects.create(
            trainer=self.profile,
            photo='trainers/photos/test.jpg',
            photo_type='gym'
        )
        assert str(photo) == "testtrainer - gym"


@pytest.mark.django_db
class TestTrainerCertification:
    """Test trainer certification model"""

    def setup_method(self):
        self.user = User.objects.create_user(
            email='trainer@test.com',
            username='testtrainer',
            password='password123',
            role='trainer'
        )
        self.profile = TrainerProfile.objects.create(
            user=self.user,
            bio="Test bio",
            address="San Francisco, CA",
            location=Point(-122.4194, 37.7749),
            hourly_rate=50.00,
        )

    def test_create_certification(self):
        """Test creating certification"""
        cert = TrainerCertification.objects.create(
            trainer=self.profile,
            name='NASM CPT',
            issuing_organization='NASM',
            issue_date=date.today(),
            expiry_date=date.today() + timedelta(days=365),
            credential_id='123456'
        )

        assert cert.trainer == self.profile
        assert cert.name == 'NASM CPT'
        assert cert.issuing_organization == 'NASM'
        assert cert.is_expired() is False

    def test_certification_expired(self):
        """Test expired certification"""
        cert = TrainerCertification.objects.create(
            trainer=self.profile,
            name='Old Cert',
            issuing_organization='Test Org',
            issue_date=date.today() - timedelta(days=730),
            expiry_date=date.today() - timedelta(days=1),
        )

        assert cert.is_expired() is True

    def test_certification_no_expiry(self):
        """Test certification with no expiry"""
        cert = TrainerCertification.objects.create(
            trainer=self.profile,
            name='Lifetime Cert',
            issuing_organization='Test Org',
            issue_date=date.today(),
        )

        assert cert.is_expired() is False

    def test_certification_str(self):
        """Test string representation"""
        cert = TrainerCertification.objects.create(
            trainer=self.profile,
            name='NASM CPT',
            issuing_organization='NASM'
        )
        assert str(cert) == "testtrainer - NASM CPT"
