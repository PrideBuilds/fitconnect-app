from django.db import models
from decimal import Decimal


class Payment(models.Model):
    """Tracks payment transactions via Stripe"""

    STATUS_CHOICES = [
        ('pending', 'Pending - Payment initiated'),
        ('processing', 'Processing - Awaiting confirmation'),
        ('succeeded', 'Succeeded - Payment completed'),
        ('failed', 'Failed - Payment unsuccessful'),
        ('canceled', 'Canceled - Payment canceled'),
        ('refunded', 'Refunded - Payment refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    # Relationships
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payment',
        help_text="The booking this payment is for"
    )
    client = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        related_name='payments_made',
        help_text="Client who made the payment"
    )
    trainer = models.ForeignKey(
        'trainers.TrainerProfile',
        on_delete=models.PROTECT,
        related_name='payments_received',
        help_text="Trainer receiving the payment"
    )

    # Stripe IDs
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Stripe PaymentIntent ID"
    )
    stripe_charge_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Stripe Charge ID (after payment succeeds)"
    )

    # Payment Details
    amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Payment amount in dollars"
    )
    currency = models.CharField(
        max_length=3,
        default='usd',
        help_text="Currency code (USD, EUR, etc.)"
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Fees and Payout (FitConnect takes a platform fee)
    platform_fee_percentage = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal('15.00'),
        help_text="Platform fee percentage (default 15%)"
    )
    platform_fee_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Calculated platform fee in dollars"
    )
    trainer_payout_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Amount trainer receives after platform fee"
    )

    # Refund Tracking
    refund_amount = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total amount refunded"
    )
    refund_reason = models.TextField(
        blank=True,
        help_text="Reason for refund"
    )
    refunded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the refund was processed"
    )

    # Payment Method
    payment_method_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Payment method (card, etc.)"
    )
    card_brand = models.CharField(
        max_length=20,
        blank=True,
        help_text="Card brand (Visa, Mastercard, etc.)"
    )
    card_last4 = models.CharField(
        max_length=4,
        blank=True,
        help_text="Last 4 digits of card"
    )

    # Receipt
    receipt_url = models.URLField(
        blank=True,
        help_text="Stripe receipt URL"
    )

    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional payment metadata"
    )

    # Error Handling
    failure_code = models.CharField(
        max_length=100,
        blank=True,
        help_text="Stripe failure code if payment failed"
    )
    failure_message = models.TextField(
        blank=True,
        help_text="Stripe failure message"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'payment'
        verbose_name_plural = 'payments'
        indexes = [
            models.Index(fields=['client', '-created_at']),
            models.Index(fields=['trainer', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['stripe_payment_intent_id']),
        ]

    def __str__(self):
        return f"Payment {self.stripe_payment_intent_id[:20]}... - {self.status} - ${self.amount}"

    def save(self, *args, **kwargs):
        """Auto-calculate fees and trainer payout"""
        if not self.platform_fee_amount or not self.trainer_payout_amount:
            # Calculate platform fee
            self.platform_fee_amount = (self.amount * self.platform_fee_percentage / Decimal('100')).quantize(Decimal('0.01'))
            # Calculate trainer payout (amount - platform fee)
            self.trainer_payout_amount = (self.amount - self.platform_fee_amount).quantize(Decimal('0.01'))

        super().save(*args, **kwargs)

    def is_refundable(self):
        """Check if payment can be refunded"""
        return self.status == 'succeeded' and self.refund_amount < self.amount

    def get_refundable_amount(self):
        """Get amount that can still be refunded"""
        return self.amount - self.refund_amount

    def mark_succeeded(self, charge_id, receipt_url='', payment_method_details=None):
        """Mark payment as succeeded"""
        self.status = 'succeeded'
        self.stripe_charge_id = charge_id
        self.receipt_url = receipt_url

        if payment_method_details:
            self.payment_method_type = payment_method_details.get('type', '')
            if self.payment_method_type == 'card':
                card = payment_method_details.get('card', {})
                self.card_brand = card.get('brand', '')
                self.card_last4 = card.get('last4', '')

        self.save()

    def mark_failed(self, failure_code='', failure_message=''):
        """Mark payment as failed"""
        self.status = 'failed'
        self.failure_code = failure_code
        self.failure_message = failure_message
        self.save()

    def process_refund(self, refund_amount, reason=''):
        """Process a refund (full or partial)"""
        from django.utils import timezone

        if not self.is_refundable():
            raise ValueError("Payment is not refundable")

        if refund_amount > self.get_refundable_amount():
            raise ValueError(f"Refund amount ${refund_amount} exceeds refundable amount ${self.get_refundable_amount()}")

        self.refund_amount += refund_amount
        self.refund_reason = reason
        self.refunded_at = timezone.now()

        # Update status
        if self.refund_amount >= self.amount:
            self.status = 'refunded'
        else:
            self.status = 'partially_refunded'

        self.save()
