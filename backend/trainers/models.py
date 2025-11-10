from django.db import models
from django.utils.text import slugify
from django.contrib.gis.db import models as gis_models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import datetime, timedelta


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
        related_name='trainer_profile_new'  # Temporary different name to avoid conflicts
    )

    # Basic Info
    bio = models.TextField(
        max_length=500,
        blank=True,
        help_text="Tell clients about your training philosophy"
    )
    years_experience = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(50)]
    )

    # Location (PostGIS)
    address = models.CharField(max_length=255, blank=True)
    location = gis_models.PointField(
        geography=True,
        null=True,
        blank=True,
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
        default=0.00,
        validators=[MinValueValidator(0)]
    )

    # Specializations
    specializations = models.ManyToManyField(
        Specialization,
        related_name='trainers',
        blank=True,
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
            gis_models.Index(fields=['location']),  # PostGIS spatial index
            models.Index(fields=['verified', 'published']),
            models.Index(fields=['average_rating']),
        ]

    def __str__(self):
        return f"{self.user.email} - Trainer"

    def save(self, *args, **kwargs):
        # Auto-generate slug from username and city
        if not self.slug:
            city = "trainer"  # Parse from address or default
            base_slug = slugify(f"{self.user.username}-{city}")
            self.slug = base_slug

            # Ensure uniqueness
            counter = 1
            while TrainerProfile.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
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
        return timezone.now().date() > self.expiry_date


class AvailabilitySlot(models.Model):
    """Recurring weekly availability slots for trainers"""

    DAY_OF_WEEK_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    trainer = models.ForeignKey(
        TrainerProfile,
        on_delete=models.CASCADE,
        related_name='availability_slots'
    )
    day_of_week = models.IntegerField(
        choices=DAY_OF_WEEK_CHOICES,
        help_text="0=Monday, 6=Sunday"
    )
    start_time = models.TimeField(help_text="Start time (e.g., 09:00)")
    end_time = models.TimeField(help_text="End time (e.g., 17:00)")
    is_available = models.BooleanField(
        default=True,
        help_text="Toggle to temporarily disable without deleting"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        verbose_name = 'availability slot'
        verbose_name_plural = 'availability slots'
        indexes = [
            models.Index(fields=['trainer', 'day_of_week', 'is_available']),
        ]

    def __str__(self):
        day_name = dict(self.DAY_OF_WEEK_CHOICES)[self.day_of_week]
        return f"{self.trainer.user.username} - {day_name} {self.start_time}-{self.end_time}"

    def clean(self):
        """Validate that end_time is after start_time"""
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")

    def check_overlap(self):
        """Check if this slot overlaps with existing slots for the same trainer"""
        overlapping = AvailabilitySlot.objects.filter(
            trainer=self.trainer,
            day_of_week=self.day_of_week,
            is_available=True
        ).exclude(pk=self.pk)

        for slot in overlapping:
            if (self.start_time < slot.end_time and self.end_time > slot.start_time):
                return True
        return False


class BookedSlot(models.Model):
    """Actual booked time slots (will be integrated with booking system)"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    trainer = models.ForeignKey(
        TrainerProfile,
        on_delete=models.CASCADE,
        related_name='booked_slots'
    )
    client = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='booked_training_slots'
    )
    start_datetime = models.DateTimeField(help_text="Booking start date and time")
    end_datetime = models.DateTimeField(help_text="Booking end date and time")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Booking details
    notes = models.TextField(blank=True, help_text="Client notes or special requests")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_datetime']
        verbose_name = 'booked slot'
        verbose_name_plural = 'booked slots'
        indexes = [
            models.Index(fields=['trainer', 'start_datetime', 'status']),
            models.Index(fields=['client', 'start_datetime']),
        ]

    def __str__(self):
        return f"{self.trainer.user.username} - {self.client.username} ({self.start_datetime.date()})"

    def clean(self):
        """Validate booking times"""
        from django.core.exceptions import ValidationError
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError("End time must be after start time")

            # Check if booking is in the past
            if self.start_datetime < timezone.now():
                raise ValidationError("Cannot book slots in the past")

    def duration_minutes(self):
        """Calculate session duration in minutes"""
        if self.start_datetime and self.end_datetime:
            duration = self.end_datetime - self.start_datetime
            return int(duration.total_seconds() / 60)
        return 0
