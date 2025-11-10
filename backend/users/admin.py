from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerificationToken, PasswordResetToken, ClientProfile, TrainerProfile


class ClientProfileInline(admin.StackedInline):
    model = ClientProfile
    can_delete = False
    verbose_name_plural = 'Client Profile'
    fk_name = 'user'


class TrainerProfileInline(admin.StackedInline):
    model = TrainerProfile
    can_delete = False
    verbose_name_plural = 'Trainer Profile'
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom user admin"""
    list_display = ('email', 'username', 'role', 'email_verified', 'is_staff', 'date_joined')
    list_filter = ('role', 'email_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'phone')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'email_verified', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'email_verified', 'phone')}),
    )

    def get_inlines(self, request, obj):
        if not obj:
            return []
        inlines = []
        if obj.role == 'client':
            inlines.append(ClientProfileInline)
        elif obj.role == 'trainer':
            inlines.append(TrainerProfileInline)
        return inlines


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    """Email verification token admin"""
    list_display = ('user', 'token', 'created_at')
    search_fields = ('user__email', 'token')
    readonly_fields = ('created_at',)


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Password reset token admin"""
    list_display = ('user', 'token', 'created_at')
    search_fields = ('user__email', 'token')
    readonly_fields = ('created_at',)


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    """Client profile admin"""
    list_display = ('user', 'address', 'created_at')
    search_fields = ('user__email', 'address')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TrainerProfile)
class TrainerProfileAdmin(admin.ModelAdmin):
    """Trainer profile admin"""
    list_display = ('user', 'verified', 'created_at')
    list_filter = ('verified',)
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at')
