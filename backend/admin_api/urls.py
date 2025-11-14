from django.urls import path
from .views import (
    AdminDashboardStatsView,
    AdminUsersListView,
    AdminTrainerApprovalView,
    AdminBookingsListView,
)

app_name = 'admin_api'

urlpatterns = [
    # Dashboard statistics
    path('stats/', AdminDashboardStatsView.as_view(), name='stats'),

    # User management
    path('users/', AdminUsersListView.as_view(), name='users-list'),

    # Trainer approval
    path('trainers/<int:trainer_id>/approve/', AdminTrainerApprovalView.as_view(), name='trainer-approve'),

    # Bookings oversight
    path('bookings/', AdminBookingsListView.as_view(), name='bookings-list'),
]
