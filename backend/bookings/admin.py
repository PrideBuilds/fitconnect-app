from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client_email',
        'trainer_name',
        'session_date',
        'start_time',
        'status',
        'total_price',
        'created_at',
    )
    list_filter = ('status', 'session_date', 'created_at')
    search_fields = (
        'client__email',
        'client__first_name',
        'client__last_name',
        'trainer__user__email',
        'trainer__user__first_name',
        'trainer__user__last_name',
    )
    readonly_fields = ('created_at', 'updated_at', 'cancelled_at')
    date_hierarchy = 'session_date'

    fieldsets = (
        ('Booking Information', {
            'fields': (
                'trainer',
                'client',
                'status',
            )
        }),
        ('Session Details', {
            'fields': (
                'session_date',
                'start_time',
                'end_time',
                'duration_minutes',
                'location_address',
            )
        }),
        ('Pricing', {
            'fields': (
                'hourly_rate',
                'total_price',
            )
        }),
        ('Notes', {
            'fields': (
                'client_notes',
                'trainer_notes',
            )
        }),
        ('Cancellation', {
            'fields': (
                'cancellation_reason',
                'cancelled_at',
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )

    def client_email(self, obj):
        return obj.client.email
    client_email.short_description = 'Client'

    def trainer_name(self, obj):
        return f"{obj.trainer.user.first_name} {obj.trainer.user.last_name}"
    trainer_name.short_description = 'Trainer'
