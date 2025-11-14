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
    """Comprehensive fitness profile for clients"""

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    FITNESS_LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('athlete', 'Athlete'),
    ]

    FITNESS_GOAL_CHOICES = [
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('endurance', 'Build Endurance'),
        ('strength', 'Build Strength'),
        ('flexibility', 'Improve Flexibility'),
        ('general_fitness', 'General Fitness'),
        ('sports_performance', 'Sports Performance'),
        ('rehabilitation', 'Rehabilitation'),
        ('stress_relief', 'Stress Relief'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='client_profile'
    )

    # Basic Info
    bio = models.TextField(max_length=500, blank=True, help_text="Tell trainers about yourself")
    profile_photo = models.ImageField(upload_to='clients/photos/', blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)

    # Location
    location = gis_models.PointField(geography=True, null=True, blank=True)
    address = models.CharField(max_length=255, blank=True)

    # Physical Stats
    height_inches = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Height in inches"
    )
    current_weight_lbs = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Current weight in pounds"
    )
    target_weight_lbs = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Target weight in pounds"
    )

    # Fitness Profile
    fitness_level = models.CharField(
        max_length=20,
        choices=FITNESS_LEVEL_CHOICES,
        default='beginner',
        help_text="Current fitness level"
    )
    primary_goal = models.CharField(
        max_length=30,
        choices=FITNESS_GOAL_CHOICES,
        blank=True,
        help_text="Primary fitness goal"
    )
    secondary_goals = models.JSONField(
        default=list,
        blank=True,
        help_text="Additional fitness goals (stored as list)"
    )

    # Health Information
    health_conditions = models.TextField(
        blank=True,
        help_text="Any health conditions or injuries trainers should know about"
    )
    medications = models.TextField(
        blank=True,
        help_text="Current medications (optional)"
    )
    dietary_restrictions = models.TextField(
        blank=True,
        help_text="Dietary restrictions or preferences"
    )

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)

    # Workout Preferences
    preferred_workout_days = models.JSONField(
        default=list,
        blank=True,
        help_text="Preferred days of week for workouts (e.g., ['monday', 'wednesday', 'friday'])"
    )
    preferred_workout_times = models.JSONField(
        default=list,
        blank=True,
        help_text="Preferred times of day (e.g., ['morning', 'evening'])"
    )
    sessions_per_week = models.IntegerField(
        null=True,
        blank=True,
        help_text="Desired number of training sessions per week"
    )
    preferred_session_duration = models.IntegerField(
        null=True,
        blank=True,
        help_text="Preferred session duration in minutes"
    )

    # Preferences
    preferred_specializations = models.ManyToManyField(
        'trainers.Specialization',
        blank=True,
        related_name='interested_clients',
        help_text="Client's preferred training specializations"
    )
    preferred_training_style = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g., 'High intensity', 'Low impact', 'Bodyweight only'"
    )

    # Profile Completion
    profile_complete = models.BooleanField(
        default=False,
        help_text="True if client has completed their fitness profile"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'client profile'
        verbose_name_plural = 'client profiles'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['fitness_level']),
            models.Index(fields=['primary_goal']),
        ]

    def __str__(self):
        return f"{self.user.email} - Client Profile"

    @property
    def age(self):
        """Calculate age from date of birth"""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    @property
    def bmi(self):
        """Calculate BMI if height and weight are available (using imperial units)"""
        if self.height_inches and self.current_weight_lbs:
            # BMI = (weight_lbs / (height_in ^ 2)) * 703
            return round((float(self.current_weight_lbs) / (float(self.height_inches) ** 2)) * 703, 1)
        return None


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
