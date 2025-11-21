from rest_framework import serializers
from .models import Payment
from bookings.models import Booking


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""

    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    trainer_email = serializers.EmailField(source='trainer.user.email', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'booking',
            'booking_id',
            'client',
            'client_email',
            'trainer',
            'trainer_email',
            'stripe_payment_intent_id',
            'stripe_charge_id',
            'amount',
            'currency',
            'status',
            'platform_fee_percentage',
            'platform_fee_amount',
            'trainer_payout_amount',
            'refund_amount',
            'refund_reason',
            'refunded_at',
            'payment_method_type',
            'card_brand',
            'card_last4',
            'receipt_url',
            'failure_code',
            'failure_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'booking_id',
            'client',
            'client_email',
            'trainer',
            'trainer_email',
            'stripe_payment_intent_id',
            'stripe_charge_id',
            'platform_fee_amount',
            'trainer_payout_amount',
            'refund_amount',
            'refund_reason',
            'refunded_at',
            'payment_method_type',
            'card_brand',
            'card_last4',
            'receipt_url',
            'failure_code',
            'failure_message',
            'created_at',
            'updated_at',
        ]


class CreatePaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating a Stripe PaymentIntent"""

    booking_id = serializers.IntegerField(
        required=True,
        help_text="ID of the booking to create payment for"
    )

    def validate_booking_id(self, value):
        """Validate that booking exists and requires payment"""
        try:
            booking = Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")

        # Check if booking is already paid
        if booking.payment_status == 'paid':
            raise serializers.ValidationError("Booking is already paid")

        # Check if booking is cancelled
        if booking.status in ['cancelled_by_client', 'cancelled_by_trainer']:
            raise serializers.ValidationError("Cannot pay for a cancelled booking")

        return value


class RefundPaymentSerializer(serializers.Serializer):
    """Serializer for processing refunds"""

    amount = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=True,
        help_text="Amount to refund (leave blank for full refund)"
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Reason for refund"
    )

    def validate_amount(self, value):
        """Validate refund amount"""
        if value <= 0:
            raise serializers.ValidationError("Refund amount must be greater than 0")
        return value
