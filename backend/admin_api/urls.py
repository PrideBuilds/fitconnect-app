from django.urls import path
from .views import (
    AdminDashboardStatsView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminTrainerApprovalView,
    AdminTrainerDetailView,
    AdminBookingsListView,
    AdminBookingDetailView,
    AdminBookingCancelView,
    AdminExportUsersCSVView,
    AdminExportBookingsCSVView,
    AdminReviewsListView,
    AdminReviewToggleVisibilityView,
    AdminReviewMarkSpamView,
)

app_name = 'admin_api'

urlpatterns = [
    # Dashboard statistics
    path('stats/', AdminDashboardStatsView.as_view(), name='stats'),

    # User management
    path('users/', AdminUsersListView.as_view(), name='users-list'),
    path('users/<int:user_id>/', AdminUserDetailView.as_view(), name='user-detail'),

    # Trainer approval
    path('trainers/<int:trainer_id>/', AdminTrainerDetailView.as_view(), name='trainer-detail'),
    path('trainers/<int:trainer_id>/approve/', AdminTrainerApprovalView.as_view(), name='trainer-approve'),

    # Bookings oversight
    path('bookings/', AdminBookingsListView.as_view(), name='bookings-list'),
    path('bookings/<int:booking_id>/', AdminBookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:booking_id>/cancel/', AdminBookingCancelView.as_view(), name='booking-cancel'),

    # CSV exports
    path('export/users/', AdminExportUsersCSVView.as_view(), name='export-users'),
    path('export/bookings/', AdminExportBookingsCSVView.as_view(), name='export-bookings'),

    # Review moderation
    path('reviews/', AdminReviewsListView.as_view(), name='reviews-list'),
    path('reviews/<int:review_id>/', AdminReviewToggleVisibilityView.as_view(), name='review-toggle-visibility'),
    path('reviews/<int:review_id>/spam/', AdminReviewMarkSpamView.as_view(), name='review-mark-spam'),
]
