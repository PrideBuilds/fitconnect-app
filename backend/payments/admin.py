from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'booking',
        'client',
        'trainer',
        'amount',
        'status',
        'payment_method_type',
        'created_at'
    ]
    list_filter = ['status', 'payment_method_type', 'created_at']
    search_fields = [
        'stripe_payment_intent_id',
        'stripe_charge_id',
        'client__email',
        'trainer__user__email'
    ]
    readonly_fields = [
        'stripe_payment_intent_id',
        'stripe_charge_id',
        'platform_fee_amount',
        'trainer_payout_amount',
        'created_at',
        'updated_at'
    ]
    fieldsets = (
        ('Booking Information', {
            'fields': ('booking', 'client', 'trainer')
        }),
        ('Stripe Information', {
            'fields': ('stripe_payment_intent_id', 'stripe_charge_id', 'receipt_url')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'status', 'payment_method_type', 'card_brand', 'card_last4')
        }),
        ('Platform Fees', {
            'fields': ('platform_fee_percentage', 'platform_fee_amount', 'trainer_payout_amount')
        }),
        ('Refund Information', {
            'fields': ('refund_amount', 'refund_reason', 'refunded_at')
        }),
        ('Error Information', {
            'fields': ('failure_code', 'failure_message')
        }),
        ('Metadata', {
            'fields': ('metadata', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
