from django.urls import path
from .views import (
    BookingListCreateView,
    BookingDetailView,
    ReviewListCreateView,
    ReviewDetailView
)

app_name = 'bookings'

urlpatterns = [
    # List all bookings and create new booking
    path('', BookingListCreateView.as_view(), name='booking-list-create'),

    # Booking detail, update, and cancel
    path('<int:booking_id>/', BookingDetailView.as_view(), name='booking-detail'),

    # List all reviews and create new review
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),

    # Review detail, update, and delete
    path('reviews/<int:review_id>/', ReviewDetailView.as_view(), name='review-detail'),
]
