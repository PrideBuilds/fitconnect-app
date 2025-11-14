from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta
from decimal import Decimal
import csv

from users.models import User
from trainers.models import TrainerProfile
from bookings.models import Booking, Review


class StandardPagination(PageNumberPagination):
    """Standard pagination class for admin views"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsAdmin(IsAuthenticated):
    """Permission class to check if user is admin"""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'admin'


class AdminDashboardStatsView(APIView):
    """
    GET /api/v1/admin/stats/
    Get platform statistics for admin dashboard
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        """Get dashboard statistics"""

        # User statistics
        total_users = User.objects.count()
        clients = User.objects.filter(role='client').count()
        trainers = User.objects.filter(role='trainer').count()

        # New users this month
        month_ago = timezone.now() - timedelta(days=30)
        new_users_month = User.objects.filter(date_joined__gte=month_ago).count()

        # Trainer statistics
        total_trainers = TrainerProfile.objects.count()
        published_trainers = TrainerProfile.objects.filter(published=True).count()
        pending_trainers = TrainerProfile.objects.filter(published=False).count()
        verified_trainers = TrainerProfile.objects.filter(verified=True).count()

        # Booking statistics
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        confirmed_bookings = Booking.objects.filter(status='confirmed').count()
        completed_bookings = Booking.objects.filter(status='completed').count()
        cancelled_bookings = Booking.objects.filter(
            status__in=['cancelled_by_client', 'cancelled_by_trainer']
        ).count()

        # Revenue statistics
        total_revenue = Booking.objects.filter(
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')

        # Revenue this month
        month_revenue = Booking.objects.filter(
            status__in=['confirmed', 'completed'],
            created_at__gte=month_ago
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')

        # Average booking price
        avg_booking_price = Booking.objects.filter(
            status__in=['confirmed', 'completed']
        ).aggregate(avg=Avg('total_price'))['avg'] or Decimal('0')

        # Bookings by status (for chart)
        bookings_by_status = {
            'pending': pending_bookings,
            'confirmed': confirmed_bookings,
            'completed': completed_bookings,
            'cancelled': cancelled_bookings,
        }

        # Bookings trend (last 7 days)
        bookings_trend = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            count = Booking.objects.filter(
                created_at__date=date
            ).count()
            bookings_trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })

        # Revenue trend (last 7 days)
        revenue_trend = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            revenue = Booking.objects.filter(
                created_at__date=date,
                status__in=['confirmed', 'completed']
            ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')
            revenue_trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'revenue': float(revenue)
            })

        # Top trainers by bookings
        top_trainers = TrainerProfile.objects.annotate(
            booking_count=Count('bookings_received')
        ).order_by('-booking_count')[:5]

        top_trainers_data = [{
            'id': t.id,
            'name': f"{t.user.first_name} {t.user.last_name}",
            'bookings': t.booking_count,
            'rating': float(t.average_rating) if t.average_rating else 0
        } for t in top_trainers]

        # Review statistics
        total_reviews = Review.objects.count()
        visible_reviews = Review.objects.filter(is_visible=True).count()
        hidden_reviews = Review.objects.filter(is_visible=False).count()
        verified_reviews = Review.objects.filter(is_verified=True).count()
        avg_rating = Review.objects.filter(is_visible=True).aggregate(
            avg=Avg('rating')
        )['avg'] or 0

        return Response({
            'users': {
                'total': total_users,
                'clients': clients,
                'trainers': trainers,
                'new_this_month': new_users_month,
            },
            'trainers': {
                'total': total_trainers,
                'published': published_trainers,
                'pending': pending_trainers,
                'verified': verified_trainers,
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
                'confirmed': confirmed_bookings,
                'completed': completed_bookings,
                'cancelled': cancelled_bookings,
                'by_status': bookings_by_status,
                'trend': bookings_trend,
            },
            'reviews': {
                'total': total_reviews,
                'visible': visible_reviews,
                'hidden': hidden_reviews,
                'verified': verified_reviews,
                'average_rating': float(avg_rating),
            },
            'revenue': {
                'total': float(total_revenue),
                'this_month': float(month_revenue),
                'average_booking': float(avg_booking_price),
                'trend': revenue_trend,
            },
            'top_trainers': top_trainers_data,
        })


class AdminUsersListView(APIView):
    """
    GET /api/v1/admin/users/
    List all users with filtering and pagination
    """
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get(self, request):
        """List users with pagination"""
        role = request.query_params.get('role')
        search = request.query_params.get('search')

        queryset = User.objects.all().order_by('-date_joined')

        if role:
            queryset = queryset.filter(role=role)

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        # Paginate queryset
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        users_data = [{
            'id': u.id,
            'email': u.email,
            'username': u.username,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': u.role,
            'email_verified': u.email_verified,
            'is_active': u.is_active,
            'date_joined': u.date_joined.isoformat(),
        } for u in paginated_queryset]

        return paginator.get_paginated_response(users_data)


class AdminTrainerApprovalView(APIView):
    """
    PATCH /api/v1/admin/trainers/{id}/approve/
    Approve or reject trainer profile
    """
    permission_classes = [IsAdmin]

    def patch(self, request, trainer_id):
        """Approve/reject trainer"""
        try:
            trainer = TrainerProfile.objects.get(id=trainer_id)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')  # 'approve' or 'reject'

        if action == 'approve':
            trainer.published = True
            trainer.save()
            return Response({
                'message': 'Trainer approved successfully',
                'trainer': {
                    'id': trainer.id,
                    'name': f"{trainer.user.first_name} {trainer.user.last_name}",
                    'published': trainer.published
                }
            })
        elif action == 'reject':
            # For now, just mark as not published
            # Could add rejection reason field later
            trainer.published = False
            trainer.save()
            return Response({
                'message': 'Trainer rejected',
                'trainer': {
                    'id': trainer.id,
                    'published': trainer.published
                }
            })
        else:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminUserDetailView(APIView):
    """
    GET /api/v1/admin/users/{user_id}/
    Get detailed information about a specific user

    PATCH /api/v1/admin/users/{user_id}/
    Update user status or role

    DELETE /api/v1/admin/users/{user_id}/
    Delete (deactivate) a user
    """
    permission_classes = [IsAdmin]

    def get(self, request, user_id):
        """Get user details"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get user's bookings count
        if user.role == 'client':
            bookings_count = Booking.objects.filter(client=user).count()
        elif user.role == 'trainer':
            try:
                # Use the correct related_name
                if hasattr(user, 'trainer_profile_new'):
                    trainer_profile = user.trainer_profile_new
                    bookings_count = Booking.objects.filter(trainer=trainer_profile).count()
                else:
                    bookings_count = 0
            except Exception:
                bookings_count = 0
        else:
            bookings_count = 0

        user_data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'email_verified': user.email_verified,
            'is_active': user.is_active,
            'phone': user.phone,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'bookings_count': bookings_count,
        }

        # Add profile data if available
        if user.role == 'client' and hasattr(user, 'client_profile'):
            profile = user.client_profile
            user_data['profile'] = {
                'profile_complete': profile.profile_complete,
                'fitness_level': profile.fitness_level,
                'primary_goal': profile.primary_goal,
                'location': profile.address,
            }
        elif user.role == 'trainer' and hasattr(user, 'trainer_profile_new'):
            profile = user.trainer_profile_new
            user_data['profile'] = {
                'published': profile.published,
                'verified': profile.verified,
                'profile_complete': profile.profile_complete,
                'hourly_rate': float(profile.hourly_rate) if profile.hourly_rate else None,
                'years_experience': profile.years_experience,
                'average_rating': float(profile.average_rating) if profile.average_rating else None,
                'total_reviews': profile.total_reviews,
            }

        return Response(user_data)

    def patch(self, request, user_id):
        """Update user status or role"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent admin from deactivating themselves
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot modify your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update fields
        is_active = request.data.get('is_active')
        new_role = request.data.get('role')

        if is_active is not None:
            user.is_active = is_active

        if new_role and new_role in ['client', 'trainer', 'admin']:
            user.role = new_role

        user.save()

        return Response({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'is_active': user.is_active,
                'role': user.role,
            }
        })

    def delete(self, request, user_id):
        """Delete (deactivate) a user"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent admin from deleting themselves
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Soft delete: deactivate instead of hard delete
        user.is_active = False
        user.save()

        return Response(
            {'message': 'User deactivated successfully'},
            status=status.HTTP_200_OK
        )


class AdminTrainerDetailView(APIView):
    """
    GET /api/v1/admin/trainers/{trainer_id}/
    Get detailed information about a specific trainer
    """
    permission_classes = [IsAdmin]

    def get(self, request, trainer_id):
        """Get trainer details"""
        try:
            trainer = TrainerProfile.objects.select_related('user').prefetch_related(
                'specializations',
                'photos',
                'certifications'
            ).get(id=trainer_id)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get booking statistics
        total_bookings = Booking.objects.filter(trainer=trainer).count()
        completed_bookings = Booking.objects.filter(
            trainer=trainer,
            status='completed'
        ).count()
        total_revenue = Booking.objects.filter(
            trainer=trainer,
            status__in=['confirmed', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or Decimal('0')

        trainer_data = {
            'id': trainer.id,
            'user': {
                'id': trainer.user.id,
                'email': trainer.user.email,
                'username': trainer.user.username,
                'first_name': trainer.user.first_name,
                'last_name': trainer.user.last_name,
                'phone': trainer.user.phone,
                'email_verified': trainer.user.email_verified,
                'date_joined': trainer.user.date_joined.isoformat(),
            },
            'bio': trainer.bio,
            'hourly_rate': float(trainer.hourly_rate) if trainer.hourly_rate else None,
            'years_experience': trainer.years_experience,
            'address': trainer.address,
            'service_radius_miles': trainer.service_radius_miles,
            'published': trainer.published,
            'verified': trainer.verified,
            'profile_complete': trainer.profile_complete,
            'average_rating': float(trainer.average_rating) if trainer.average_rating else None,
            'total_reviews': trainer.total_reviews,
            'specializations': [
                {
                    'id': s.id,
                    'name': s.name,
                    'slug': s.slug,
                }
                for s in trainer.specializations.all()
            ],
            'photos': [
                {
                    'id': p.id,
                    'photo_type': p.photo_type,
                    'photo_url': request.build_absolute_uri(p.photo.url) if p.photo else None,
                    'caption': p.caption,
                }
                for p in trainer.photos.all()
            ],
            'certifications': [
                {
                    'name': c.name,
                    'issuing_organization': c.issuing_organization,
                    'year_obtained': c.year_obtained,
                }
                for c in trainer.certifications.all()
            ],
            'statistics': {
                'total_bookings': total_bookings,
                'completed_bookings': completed_bookings,
                'total_revenue': float(total_revenue),
            },
            'created_at': trainer.created_at.isoformat(),
            'updated_at': trainer.updated_at.isoformat(),
        }

        return Response(trainer_data)


class AdminBookingDetailView(APIView):
    """
    GET /api/v1/admin/bookings/{booking_id}/
    Get detailed information about a specific booking
    """
    permission_classes = [IsAdmin]

    def get(self, request, booking_id):
        """Get booking details"""
        try:
            booking = Booking.objects.select_related(
                'trainer__user', 'client'
            ).get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Combine date and time for session_datetime
        from datetime import datetime, time
        session_datetime = datetime.combine(booking.session_date, booking.start_time)

        booking_data = {
            'id': booking.id,
            'trainer': {
                'id': booking.trainer.id,
                'first_name': booking.trainer.user.first_name,
                'last_name': booking.trainer.user.last_name,
                'email': booking.trainer.user.email,
                'phone': booking.trainer.user.phone or '',
                'username': booking.trainer.user.username,
            },
            'client': {
                'id': booking.client.id,
                'first_name': booking.client.first_name,
                'last_name': booking.client.last_name,
                'email': booking.client.email,
                'phone': booking.client.phone or '',
                'username': booking.client.username,
            },
            'session_datetime': session_datetime.isoformat(),
            'duration_minutes': booking.duration_minutes,
            'session_type': 'one_on_one',  # Default session type
            'location': booking.location_address or '',
            'total_price': float(booking.total_price),
            'status': booking.status,
            'notes': booking.client_notes or '',
            'cancellation_reason': booking.cancellation_reason or '',
            'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            'created_at': booking.created_at.isoformat(),
        }

        return Response(booking_data)


class AdminBookingCancelView(APIView):
    """
    PATCH /api/v1/admin/bookings/{booking_id}/cancel/
    Cancel a booking (admin override)
    """
    permission_classes = [IsAdmin]

    def patch(self, request, booking_id):
        """Cancel booking"""
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already cancelled
        if booking.status in ['cancelled_by_client', 'cancelled_by_trainer']:
            return Response(
                {'error': 'Booking is already cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get cancellation reason from request
        reason = request.data.get('reason', 'Cancelled by admin')

        # Update booking status
        booking.status = 'cancelled_by_trainer'  # Use trainer cancellation status
        booking.cancellation_reason = f"[ADMIN] {reason}"
        booking.cancelled_at = timezone.now()
        booking.save()

        return Response({
            'message': 'Booking cancelled successfully',
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'cancellation_reason': booking.cancellation_reason,
                'cancelled_at': booking.cancelled_at.isoformat(),
            }
        })


class AdminBookingsListView(APIView):
    """
    GET /api/v1/admin/bookings/
    List all bookings for admin oversight with pagination
    """
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get(self, request):
        """List bookings with pagination"""
        status_filter = request.query_params.get('status')

        queryset = Booking.objects.select_related(
            'trainer__user', 'client'
        ).order_by('-created_at')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Paginate queryset
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        bookings_data = [{
            'id': b.id,
            'trainer_name': f"{b.trainer.user.first_name} {b.trainer.user.last_name}",
            'client_name': f"{b.client.first_name} {b.client.last_name}",
            'session_date': b.session_date.isoformat(),
            'start_time': b.start_time.strftime('%H:%M'),
            'duration_minutes': b.duration_minutes,
            'total_price': float(b.total_price),
            'status': b.status,
            'created_at': b.created_at.isoformat(),
        } for b in paginated_queryset]

        return paginator.get_paginated_response(bookings_data)


class AdminExportUsersCSVView(APIView):
    """
    GET /api/v1/admin/export/users/
    Export all users data to CSV
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        """Export users to CSV"""
        # Get all users
        users = User.objects.select_related('client_profile', 'trainer_profile_new').all()

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="users_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)

        # Write header
        writer.writerow([
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'active',
            'email_verified',
            'date_joined',
            'last_login',
            'profile_complete',
        ])

        # Write data rows
        for user in users:
            profile_complete = 'N/A'
            if user.role == 'client' and hasattr(user, 'client_profile'):
                profile_complete = 'Yes' if user.client_profile.profile_complete else 'No'
            elif user.role == 'trainer' and hasattr(user, 'trainer_profile_new'):
                profile_complete = 'Yes' if user.trainer_profile_new.profile_complete else 'No'

            writer.writerow([
                user.id,
                user.username,
                user.email,
                user.first_name or '',
                user.last_name or '',
                user.phone or '',
                user.role,
                'Yes' if user.is_active else 'No',
                'Yes' if user.email_verified else 'No',
                user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never',
                profile_complete,
            ])

        return response


class AdminExportBookingsCSVView(APIView):
    """
    GET /api/v1/admin/export/bookings/
    Export all bookings data to CSV
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        """Export bookings to CSV"""
        # Get all bookings with related data
        bookings = Booking.objects.select_related(
            'trainer__user',
            'client'
        ).all().order_by('-created_at')

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="bookings_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'

        writer = csv.writer(response)

        # Write header
        writer.writerow([
            'id',
            'trainer_name',
            'trainer_email',
            'client_name',
            'client_email',
            'session_date',
            'start_time',
            'duration_minutes',
            'session_type',
            'location',
            'total_price',
            'status',
            'created_at',
            'special_requests',
            'cancellation_reason',
            'cancelled_at',
        ])

        # Write data rows
        for booking in bookings:
            writer.writerow([
                booking.id,
                f"{booking.trainer.user.first_name} {booking.trainer.user.last_name}",
                booking.trainer.user.email,
                f"{booking.client.first_name} {booking.client.last_name}",
                booking.client.email,
                booking.session_date.strftime('%Y-%m-%d'),
                booking.start_time.strftime('%H:%M'),
                booking.duration_minutes,
                'one_on_one',  # Default session type
                booking.location_address or '',
                f"${booking.total_price}",
                booking.status,
                booking.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                booking.client_notes or '',
                booking.cancellation_reason or '',
                booking.cancelled_at.strftime('%Y-%m-%d %H:%M:%S') if booking.cancelled_at else '',
            ])

        return response


class AdminReviewsListView(APIView):
    """
    GET /api/v1/admin/reviews/
    List all reviews with filtering options for moderation
    """
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get(self, request):
        """Get all reviews with filters"""
        # Base queryset with related data
        queryset = Review.objects.select_related(
            'trainer__user',
            'client',
            'booking'
        ).all()

        # Filter by visibility
        visibility_filter = request.query_params.get('visibility')
        if visibility_filter == 'hidden':
            queryset = queryset.filter(is_visible=False)
        elif visibility_filter == 'visible':
            queryset = queryset.filter(is_visible=True)
        # 'all' shows everything (no filter)

        # Filter by trainer
        trainer_id = request.query_params.get('trainer_id')
        if trainer_id:
            queryset = queryset.filter(trainer_id=trainer_id)

        # Filter by rating
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=int(min_rating))

        # Order by newest first
        queryset = queryset.order_by('-created_at')

        # Paginate queryset
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        # Serialize data
        reviews_data = [{
            'id': r.id,
            'rating': r.rating,
            'comment': r.comment,
            'is_visible': r.is_visible,
            'is_verified': r.is_verified,
            'trainer': {
                'id': r.trainer.id,
                'name': f"{r.trainer.user.first_name} {r.trainer.user.last_name}",
                'email': r.trainer.user.email,
            },
            'client': {
                'id': r.client.id,
                'name': f"{r.client.first_name} {r.client.last_name}",
                'email': r.client.email,
            },
            'booking': {
                'id': r.booking.id,
                'session_date': r.booking.session_date.isoformat(),
                'status': r.booking.status,
            },
            'created_at': r.created_at.isoformat(),
            'updated_at': r.updated_at.isoformat(),
        } for r in paginated_queryset]

        return paginator.get_paginated_response(reviews_data)


class AdminReviewToggleVisibilityView(APIView):
    """
    PATCH /api/v1/admin/reviews/{review_id}/
    Toggle review visibility (hide/show)
    """
    permission_classes = [IsAdmin]

    def patch(self, request, review_id):
        """Toggle review visibility"""
        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response(
                {'error': 'Review not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Toggle visibility
        is_visible = request.data.get('is_visible')
        if is_visible is not None:
            review.is_visible = is_visible
            review.save()

            action = 'shown' if is_visible else 'hidden'
            return Response({
                'message': f'Review {action} successfully',
                'review': {
                    'id': review.id,
                    'is_visible': review.is_visible,
                }
            })
        else:
            return Response(
                {'error': 'is_visible field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminReviewMarkSpamView(APIView):
    """
    PATCH /api/v1/admin/reviews/{review_id}/spam/
    Mark review as spam (hides it and marks it)
    """
    permission_classes = [IsAdmin]

    def patch(self, request, review_id):
        """Mark review as spam"""
        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response(
                {'error': 'Review not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Mark as spam by hiding it
        review.is_visible = False
        review.save()

        return Response({
            'message': 'Review marked as spam and hidden',
            'review': {
                'id': review.id,
                'is_visible': review.is_visible,
            }
        })
