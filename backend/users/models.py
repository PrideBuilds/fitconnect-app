from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.gis.db import models as gis_models
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

    def __str__(self):
        return f"Email verification for {self.user.email}"


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

    def __str__(self):
        return f"Password reset for {self.user.email}"


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
        related_name='interested_clients',
        help_text="Client's preferred training specializations"
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
