from django.urls import path
from .views import (
    BookingListCreateView,
    BookingDetailView
)

app_name = 'bookings'

urlpatterns = [
    # List all bookings and create new booking
    path('', BookingListCreateView.as_view(), name='booking-list-create'),

    # Booking detail, update, and cancel
    path('<int:booking_id>/', BookingDetailView.as_view(), name='booking-detail'),
]
