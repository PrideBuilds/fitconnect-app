from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from users.models import User
from trainers.models import TrainerProfile
from bookings.models import Booking


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
    List all users with filtering options
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        """List users"""
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
        } for u in queryset[:50]]  # Limit to 50 for now

        return Response({
            'count': queryset.count(),
            'results': users_data
        })


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


class AdminBookingsListView(APIView):
    """
    GET /api/v1/admin/bookings/
    List all bookings for admin oversight
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        """List bookings"""
        status_filter = request.query_params.get('status')

        queryset = Booking.objects.select_related(
            'trainer__user', 'client'
        ).order_by('-created_at')

        if status_filter:
            queryset = queryset.filter(status=status_filter)

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
        } for b in queryset[:100]]  # Limit to 100

        return Response({
            'count': queryset.count(),
            'results': bookings_data
        })
