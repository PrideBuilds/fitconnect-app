from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from .models import Booking, Review
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingListSerializer,
    ReviewSerializer,
    ReviewCreateSerializer
)
from .emails import send_booking_notification_emails
from trainers.models import TrainerProfile
import logging

logger = logging.getLogger(__name__)


class BookingPagination(PageNumberPagination):
    """Custom pagination for bookings"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


class BookingListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/bookings/
    List all bookings for authenticated user (client or trainer)

    POST /api/v1/bookings/
    Create a new booking (client only)

    Uses Django REST Framework's built-in ListCreateAPIView for standard CRUD operations
    """
    permission_classes = [IsAuthenticated]
    pagination_class = BookingPagination

    def get_queryset(self):
        """Filter bookings based on user role"""
        user = self.request.user

        # Filter bookings based on user role
        if user.role == 'client':
            queryset = Booking.objects.filter(client=user)
        elif user.role == 'trainer':
            try:
                trainer_profile = TrainerProfile.objects.get(user=user)
                queryset = Booking.objects.filter(trainer=trainer_profile)
            except TrainerProfile.DoesNotExist:
                raise NotFound('Trainer profile not found')
        else:
            raise PermissionDenied('Invalid user role')

        # Filter by status if provided
        booking_status = self.request.query_params.get('status')
        if booking_status:
            queryset = queryset.filter(status=booking_status)

        # Order by session date
        return queryset.order_by('-session_date', '-start_time')

    def get_serializer_class(self):
        """Use different serializers for list vs create"""
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer

    def perform_create(self, serializer):
        """Create booking with current user as client"""
        # Only clients can create bookings
        if self.request.user.role != 'client':
            raise PermissionDenied('Only clients can create bookings')

        # Save with client set to current user
        serializer.save(client=self.request.user)

    def create(self, request, *args, **kwargs):
        """Override to return full booking details and send emails after creation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Send notification emails to client and trainer
        booking = serializer.instance
        try:
            client_sent, trainer_sent = send_booking_notification_emails(booking)
            logger.info(f"Booking {booking.id} emails sent - Client: {client_sent}, Trainer: {trainer_sent}")
        except Exception as e:
            # Log error but don't fail the booking creation
            logger.error(f"Failed to send booking notification emails for booking {booking.id}: {str(e)}")

        # Return full booking details using BookingSerializer
        headers = self.get_success_headers(serializer.data)
        response_serializer = BookingSerializer(booking)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/bookings/{id}/
    Get booking details

    PATCH /api/v1/bookings/{id}/
    Update booking (confirm, update notes)

    DELETE /api/v1/bookings/{id}/
    Cancel booking

    Uses Django REST Framework's built-in RetrieveUpdateDestroyAPIView
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer
    lookup_url_kwarg = 'booking_id'

    def get_queryset(self):
        """Filter bookings based on user role - only show bookings user has access to"""
        user = self.request.user

        if user.role == 'client':
            return Booking.objects.filter(client=user)
        elif user.role == 'trainer':
            try:
                trainer_profile = TrainerProfile.objects.get(user=user)
                return Booking.objects.filter(trainer=trainer_profile)
            except TrainerProfile.DoesNotExist:
                raise NotFound('Trainer profile not found')
        else:
            raise PermissionDenied('Invalid user role')

    def update(self, request, *args, **kwargs):
        """Handle booking updates with custom actions"""
        booking = self.get_object()
        action = request.data.get('action')

        # Handle trainer actions
        if action == 'confirm' and request.user.role == 'trainer':
            booking.confirm()
            serializer = self.get_serializer(booking)
            return Response(serializer.data)

        elif action == 'complete' and request.user.role == 'trainer':
            booking.mark_completed()
            serializer = self.get_serializer(booking)
            return Response(serializer.data)

        elif action == 'no_show' and request.user.role == 'trainer':
            booking.mark_no_show()
            serializer = self.get_serializer(booking)
            return Response(serializer.data)

        # Handle notes updates
        if request.user.role == 'trainer' and 'trainer_notes' in request.data:
            booking.trainer_notes = request.data['trainer_notes']
            booking.save()
        elif request.user.role == 'client' and 'client_notes' in request.data:
            booking.client_notes = request.data['client_notes']
            booking.save()

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Cancel booking instead of deleting"""
        booking = self.get_object()

        # Check if booking can be cancelled
        if not booking.can_cancel():
            raise ValidationError(
                'Booking cannot be cancelled (must be 24 hours before session)'
            )

        # Get cancellation reason
        reason = request.data.get('reason', '')

        # Cancel booking based on user role
        if request.user.role == 'client':
            booking.cancel('client', reason)
        elif request.user.role == 'trainer':
            booking.cancel('trainer', reason)

        serializer = self.get_serializer(booking)
        return Response(serializer.data)


class ReviewListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/bookings/reviews/
    List reviews (filter by trainer, client, or all visible reviews)

    POST /api/v1/bookings/reviews/
    Create a new review for a completed booking (client only)
    """
    permission_classes = [IsAuthenticated]
    pagination_class = BookingPagination

    def get_queryset(self):
        """Filter reviews based on query parameters"""
        queryset = Review.objects.select_related('trainer__user', 'client', 'booking')

        # Filter by trainer
        trainer_id = self.request.query_params.get('trainer')
        if trainer_id:
            queryset = queryset.filter(trainer_id=trainer_id, is_visible=True)

        # Filter by client (only for authenticated client viewing their own)
        elif self.request.user.role == 'client':
            queryset = queryset.filter(client=self.request.user)

        # Default: only visible reviews
        else:
            queryset = queryset.filter(is_visible=True)

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        """Use different serializers for list vs create"""
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer

    def perform_create(self, serializer):
        """Create review with validation"""
        # Only clients can create reviews
        if self.request.user.role != 'client':
            raise PermissionDenied('Only clients can create reviews')

        serializer.save()


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/bookings/reviews/{id}/
    Get review details

    PATCH /api/v1/bookings/reviews/{id}/
    Update own review (client only)

    DELETE /api/v1/bookings/reviews/{id}/
    Delete own review (client only)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer
    lookup_url_kwarg = 'review_id'

    def get_queryset(self):
        """Filter reviews - clients can only access their own"""
        if self.request.user.role == 'client':
            return Review.objects.filter(client=self.request.user)
        else:
            # Trainers and others can view visible reviews
            return Review.objects.filter(is_visible=True)

    def get_serializer_class(self):
        """Use create serializer for updates"""
        if self.request.method in ['PATCH', 'PUT']:
            return ReviewCreateSerializer
        return ReviewSerializer

    def update(self, request, *args, **kwargs):
        """Only allow clients to update their own reviews"""
        review = self.get_object()

        if request.user != review.client:
            raise PermissionDenied('You can only update your own reviews')

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only allow clients to delete their own reviews"""
        review = self.get_object()

        if request.user != review.client:
            raise PermissionDenied('You can only delete your own reviews')

        return super().destroy(request, *args, **kwargs)


class TrainerReviewsView(generics.ListAPIView):
    """
    GET /api/v1/trainers/{trainer_id}/reviews/
    Get all visible reviews for a specific trainer
    """
    serializer_class = ReviewSerializer
    pagination_class = BookingPagination

    def get_queryset(self):
        """Get reviews for specific trainer"""
        trainer_id = self.kwargs.get('trainer_id')

        # Verify trainer exists
        try:
            TrainerProfile.objects.get(id=trainer_id)
        except TrainerProfile.DoesNotExist:
            raise NotFound('Trainer not found')

        return Review.objects.filter(
            trainer_id=trainer_id,
            is_visible=True
        ).select_related('client', 'booking').order_by('-created_at')
