from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal


class Booking(models.Model):
    """Training session booking"""

    STATUS_CHOICES = [
        ('pending', 'Pending - Awaiting trainer confirmation'),
        ('confirmed', 'Confirmed - Session scheduled'),
        ('cancelled_by_client', 'Cancelled by Client'),
        ('cancelled_by_trainer', 'Cancelled by Trainer'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid - Payment not initiated'),
        ('pending', 'Pending - Payment in progress'),
        ('paid', 'Paid - Payment successful'),
        ('failed', 'Failed - Payment unsuccessful'),
        ('refunded', 'Refunded - Payment refunded'),
    ]

    # Relationships
    trainer = models.ForeignKey(
        'trainers.TrainerProfile',
        on_delete=models.CASCADE,
        related_name='bookings_received'
    )
    client = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='bookings_made',
        limit_choices_to={'role': 'client'}
    )

    # Session Details
    session_date = models.DateField(help_text="Date of the training session")
    start_time = models.TimeField(help_text="Session start time")
    end_time = models.TimeField(help_text="Session end time")
    duration_minutes = models.IntegerField(
        validators=[MinValueValidator(15)],
        help_text="Session duration in minutes"
    )

    # Location
    location_address = models.CharField(
        max_length=255,
        help_text="Where the session will take place"
    )

    # Pricing
    hourly_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Trainer's hourly rate at time of booking"
    )
    total_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Total price for this session"
    )

    # Status
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='pending'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='unpaid',
        help_text="Payment status for this booking"
    )

    # Client Notes
    client_notes = models.TextField(
        blank=True,
        help_text="Special requests or focus areas from client"
    )
    trainer_notes = models.TextField(
        blank=True,
        help_text="Private notes for trainer"
    )

    # Cancellation
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-session_date', '-start_time']
        verbose_name = 'booking'
        verbose_name_plural = 'bookings'
        indexes = [
            models.Index(fields=['trainer', 'session_date', 'status']),
            models.Index(fields=['client', 'session_date', 'status']),
            models.Index(fields=['status', 'session_date']),
        ]

    def __str__(self):
        return f"{self.client.email} → {self.trainer.user.email} on {self.session_date}"

    @classmethod
    def check_booking_conflict(cls, trainer, session_date, start_time, end_time, exclude_booking_id=None):
        """
        Check if there's a booking conflict for the trainer at the given time.
        Uses pessimistic locking to prevent race conditions.

        Args:
            trainer: TrainerProfile instance
            session_date: Date of the session
            start_time: Start time of the session
            end_time: End time of the session
            exclude_booking_id: Booking ID to exclude from conflict check (for updates)

        Returns:
            Conflicting Booking instance if found, None otherwise
        """
        from django.db.models import Q

        # Get all bookings for this trainer on this date that aren't cancelled
        # Use select_for_update() for pessimistic locking
        bookings = cls.objects.select_for_update().filter(
            trainer=trainer,
            session_date=session_date,
            status__in=['pending', 'confirmed']  # Only check active bookings
        )

        # Exclude current booking if updating
        if exclude_booking_id:
            bookings = bookings.exclude(id=exclude_booking_id)

        # Check for time overlap
        # Overlap occurs if:
        # 1. New booking starts during existing booking
        # 2. New booking ends during existing booking
        # 3. New booking completely contains existing booking
        for booking in bookings:
            # Check if times overlap
            if (start_time < booking.end_time and end_time > booking.start_time):
                return booking

        return None

    def clean(self):
        """Validate booking data"""
        from django.core.exceptions import ValidationError

        # Validate times
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")

        # Validate session date is not in the past
        if self.session_date and self.session_date < timezone.now().date():
            raise ValidationError("Cannot book sessions in the past")

        # Validate duration matches time range
        if self.start_time and self.end_time and self.duration_minutes:
            from datetime import datetime, timedelta
            start = datetime.combine(self.session_date, self.start_time)
            end = datetime.combine(self.session_date, self.end_time)
            calculated_minutes = int((end - start).total_seconds() / 60)

            if abs(calculated_minutes - self.duration_minutes) > 1:  # Allow 1 minute tolerance
                raise ValidationError(
                    f"Duration ({self.duration_minutes} min) doesn't match time range "
                    f"({calculated_minutes} min)"
                )

    def save(self, *args, **kwargs):
        """Auto-calculate total price if not set"""
        if not self.total_price and self.hourly_rate and self.duration_minutes:
            # Calculate price: (hourly_rate / 60) * duration_minutes
            price_per_minute = self.hourly_rate / Decimal('60')
            self.total_price = price_per_minute * Decimal(str(self.duration_minutes))
            # Round to 2 decimal places
            self.total_price = self.total_price.quantize(Decimal('0.01'))

        super().save(*args, **kwargs)

    def get_start_datetime(self):
        """Get session start as timezone-aware datetime"""
        from datetime import datetime
        naive_dt = datetime.combine(self.session_date, self.start_time)
        # Make timezone-aware using Django's timezone
        return timezone.make_aware(naive_dt, timezone.get_current_timezone())

    def get_end_datetime(self):
        """Get session end as timezone-aware datetime"""
        from datetime import datetime
        naive_dt = datetime.combine(self.session_date, self.end_time)
        # Make timezone-aware using Django's timezone
        return timezone.make_aware(naive_dt, timezone.get_current_timezone())

    def is_upcoming(self):
        """Check if session is in the future"""
        return self.get_start_datetime() > timezone.now()

    def is_past(self):
        """Check if session is in the past"""
        return self.get_end_datetime() < timezone.now()

    def can_cancel(self):
        """Check if booking can be cancelled (24 hours before session)"""
        from datetime import timedelta
        if self.status not in ['pending', 'confirmed']:
            return False

        # Allow cancellation if more than 24 hours before session
        cancellation_deadline = self.get_start_datetime() - timedelta(hours=24)
        return timezone.now() < cancellation_deadline

    def confirm(self):
        """Trainer confirms the booking"""
        if self.status == 'pending':
            self.status = 'confirmed'
            self.save()

    def cancel(self, cancelled_by, reason=''):
        """Cancel the booking"""
        if cancelled_by == 'client':
            self.status = 'cancelled_by_client'
        elif cancelled_by == 'trainer':
            self.status = 'cancelled_by_trainer'

        self.cancellation_reason = reason
        self.cancelled_at = timezone.now()
        self.save()

    def mark_completed(self):
        """Mark session as completed"""
        if self.status == 'confirmed' and self.is_past():
            self.status = 'completed'
            self.save()

    def mark_no_show(self):
        """Mark client as no-show"""
        if self.status == 'confirmed' and self.is_past():
            self.status = 'no_show'
            self.save()

    def mark_paid(self):
        """Mark booking as paid"""
        self.payment_status = 'paid'
        self.save()

    def mark_payment_failed(self):
        """Mark payment as failed"""
        self.payment_status = 'failed'
        self.save()

    def mark_refunded(self):
        """Mark payment as refunded"""
        self.payment_status = 'refunded'
        self.save()

    def is_paid(self):
        """Check if booking is paid"""
        return self.payment_status == 'paid'

    def requires_payment(self):
        """Check if booking requires payment"""
        return self.payment_status in ['unpaid', 'failed']


class Review(models.Model):
    """Client review and rating for a trainer after a completed session"""

    # Relationships
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review',
        help_text="The booking being reviewed"
    )
    trainer = models.ForeignKey(
        'trainers.TrainerProfile',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    client = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='reviews_written',
        limit_choices_to={'role': 'client'}
    )

    # Review Content
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1-5 stars"
    )
    comment = models.TextField(
        blank=True,
        help_text="Written review (optional)"
    )

    # Metadata
    is_verified = models.BooleanField(
        default=True,
        help_text="Verified purchase (auto-set from booking)"
    )
    is_visible = models.BooleanField(
        default=True,
        help_text="Admin can hide inappropriate reviews"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'review'
        verbose_name_plural = 'reviews'
        indexes = [
            models.Index(fields=['trainer', '-created_at']),
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['rating']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['booking'],
                name='one_review_per_booking'
            )
        ]

    def __str__(self):
        return f"{self.rating}★ review by {self.client.email} for {self.trainer.user.email}"

    def clean(self):
        """Validate review data"""
        from django.core.exceptions import ValidationError

        # Ensure booking is completed
        if self.booking.status != 'completed':
            raise ValidationError("Can only review completed sessions")

        # Ensure client is the one who made the booking
        if self.booking.client != self.client:
            raise ValidationError("Can only review your own bookings")

        # Ensure trainer matches
        if self.booking.trainer != self.trainer:
            raise ValidationError("Trainer must match booking trainer")
