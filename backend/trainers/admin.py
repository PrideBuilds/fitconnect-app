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
    filter_horizontal = ('specializations',)

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
