from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from .models import Specialization, TrainerProfile, TrainerPhoto, AvailabilitySlot
from .serializers import (
    SpecializationSerializer,
    TrainerProfileSerializer,
    TrainerProfilePublicSerializer,
    TrainerPhotoSerializer,
    AvailabilitySlotSerializer
)
from users.permissions import IsTrainer
from .utils import geocode_address
import logging

logger = logging.getLogger(__name__)


class SpecializationListView(generics.ListAPIView):
    """
    GET /api/v1/trainers/specializations/
    List all available fitness specializations
    """
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = []  # Public endpoint


class TrainerListView(generics.ListAPIView):
    """
    GET /api/v1/trainers/
    List all trainer profiles
    """
    queryset = TrainerProfile.objects.select_related('user').all()
    serializer_class = TrainerProfilePublicSerializer
    permission_classes = [IsAuthenticated]  # Require authentication
    pagination_class = PageNumberPagination


class TrainerProfileView(APIView):
    """
    GET /api/v1/trainers/profile/
    Retrieve authenticated trainer's profile

    POST /api/v1/trainers/profile/
    Create or update authenticated trainer's profile
    """
    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        """Get current trainer's profile"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
            serializer = TrainerProfileSerializer(profile)
            return Response(serializer.data)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        """Create or update trainer profile"""
        try:
            # Try to get existing profile
            profile = TrainerProfile.objects.get(user=request.user)
            serializer = TrainerProfileSerializer(profile, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except TrainerProfile.DoesNotExist:
            # Create new profile
            serializer = TrainerProfileSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainerPhotoUploadView(APIView):
    """
    POST /api/v1/trainers/profile/photos/
    Upload a photo for the authenticated trainer's profile
    """
    permission_classes = [IsAuthenticated, IsTrainer]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Upload a photo"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found. Please create a profile first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Add trainer to request data
        data = request.data.copy()

        # Create photo instance
        serializer = TrainerPhotoSerializer(data=data)

        if serializer.is_valid():
            serializer.save(trainer=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainerPhotoDetailView(APIView):
    """
    PATCH /api/v1/trainers/profile/photos/{id}/
    Update a specific photo (photo_type, caption, order)

    DELETE /api/v1/trainers/profile/photos/{id}/
    Delete a specific photo
    """
    permission_classes = [IsAuthenticated, IsTrainer]

    def patch(self, request, photo_id):
        """Update photo metadata"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
            photo = TrainerPhoto.objects.get(id=photo_id, trainer=profile)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except TrainerPhoto.DoesNotExist:
            return Response(
                {'error': 'Photo not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TrainerPhotoSerializer(photo, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, photo_id):
        """Delete photo"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
            photo = TrainerPhoto.objects.get(id=photo_id, trainer=profile)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except TrainerPhoto.DoesNotExist:
            return Response(
                {'error': 'Photo not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete the photo file from storage
        if photo.photo:
            photo.photo.delete()

        # Delete the photo record
        photo.delete()

        return Response(
            {'message': 'Photo deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


class TrainerSearchPagination(PageNumberPagination):
    """Custom pagination for trainer search results"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


class TrainerSearchView(APIView):
    """
    GET /api/v1/trainers/search/
    Search for trainers by location, specializations, and price

    Query Parameters:
    - lat (float): Latitude coordinate
    - lng (float): Longitude coordinate
    - address (string): Address to geocode (alternative to lat/lng)
    - radius (float): Search radius in miles (default: 25)
    - specializations (comma-separated): Filter by specialization IDs or slugs
    - min_price (float): Minimum hourly rate
    - max_price (float): Maximum hourly rate
    - verified_only (bool): Show only verified trainers (default: false)
    - page (int): Page number for pagination
    - page_size (int): Number of results per page (max: 50)

    Returns:
    - count: Total number of results
    - next: URL to next page
    - previous: URL to previous page
    - results: Array of trainer profiles with distance
    """
    permission_classes = []  # Public endpoint
    pagination_class = TrainerSearchPagination

    def get(self, request):
        """Search for trainers"""
        # Get search parameters
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        address = request.query_params.get('address')
        radius = float(request.query_params.get('radius', 25))  # Default 25 miles
        specializations = request.query_params.get('specializations', '')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        verified_only = request.query_params.get('verified_only', 'false').lower() == 'true'

        # Validate and get location point
        location_point = None

        if lat and lng:
            try:
                location_point = Point(float(lng), float(lat), srid=4326)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid lat/lng coordinates'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif address:
            # Geocode the address
            location_point = geocode_address(address)
            if not location_point:
                from .utils import CITY_COORDINATES
                supported_cities = sorted(set([k.title() for k in CITY_COORDINATES.keys() if ',' not in k]))
                return Response(
                    {
                        'error': 'Could not geocode address. Try one of these cities: ' + ', '.join(supported_cities[:8]) + '...',
                        'supported_cities': supported_cities
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'error': 'Either lat/lng or address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Start with published profiles only
        queryset = TrainerProfile.objects.filter(
            published=True,
            location__isnull=False
        )

        # Filter by verification status
        if verified_only:
            queryset = queryset.filter(verified=True)

        # Filter by location radius (using PostGIS distance query)
        queryset = queryset.filter(
            location__distance_lte=(location_point, D(mi=radius))
        )

        # Annotate with distance and order by distance
        queryset = queryset.annotate(
            distance=Distance('location', location_point)
        ).order_by('distance')

        # Filter by specializations
        if specializations:
            spec_list = [s.strip() for s in specializations.split(',') if s.strip()]
            if spec_list:
                # Support both IDs and slugs
                queryset = queryset.filter(
                    specializations__id__in=spec_list
                ) | queryset.filter(
                    specializations__slug__in=spec_list
                )
                queryset = queryset.distinct()

        # Filter by price range
        if min_price:
            try:
                queryset = queryset.filter(hourly_rate__gte=float(min_price))
            except ValueError:
                pass  # Ignore invalid min_price

        if max_price:
            try:
                queryset = queryset.filter(hourly_rate__lte=float(max_price))
            except ValueError:
                pass  # Ignore invalid max_price

        # Prefetch related data to avoid N+1 queries
        queryset = queryset.select_related('user').prefetch_related(
            'specializations',
            'photos',
            'certifications'
        )

        # Paginate results
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        # Serialize results
        serializer = TrainerProfileSerializer(paginated_queryset, many=True)

        # Add distance to each result (convert from meters to miles)
        results = serializer.data
        for i, trainer in enumerate(results):
            distance_meters = paginated_queryset[i].distance.m
            trainer['distance_miles'] = round(distance_meters / 1609.34, 2)

        # Return paginated response
        return paginator.get_paginated_response(results)


class TrainerDetailView(APIView):
    """
    GET /api/v1/trainers/{id}/
    Retrieve detailed information about a specific trainer

    Public endpoint - no authentication required
    """
    permission_classes = []  # Public endpoint

    def get(self, request, trainer_id):
        """Get trainer details by ID"""
        try:
            # Get trainer profile (only published profiles visible)
            trainer = TrainerProfile.objects.select_related('user').prefetch_related(
                'specializations',
                'photos',
                'certifications'
            ).get(id=trainer_id, published=True)

        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Use public serializer (hides email and other sensitive data)
        serializer = TrainerProfilePublicSerializer(trainer)

        return Response(serializer.data, status=status.HTTP_200_OK)


class AvailabilitySlotListView(APIView):
    """
    GET /api/v1/trainers/availability/
    List all availability slots for authenticated trainer

    POST /api/v1/trainers/availability/
    Create a new availability slot for authenticated trainer
    """
    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request):
        """Get all availability slots for current trainer"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        slots = AvailabilitySlot.objects.filter(trainer=profile).order_by('day_of_week', 'start_time')
        serializer = AvailabilitySlotSerializer(slots, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new availability slot"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found. Please create a profile first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AvailabilitySlotSerializer(data=request.data)

        if serializer.is_valid():
            # Check for overlapping slots
            new_slot = AvailabilitySlot(
                trainer=profile,
                day_of_week=serializer.validated_data['day_of_week'],
                start_time=serializer.validated_data['start_time'],
                end_time=serializer.validated_data['end_time']
            )

            if new_slot.check_overlap():
                return Response(
                    {'error': 'This time slot overlaps with an existing availability slot'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save the slot
            serializer.save(trainer=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvailabilitySlotDetailView(APIView):
    """
    GET /api/v1/trainers/availability/{id}/
    Retrieve a specific availability slot

    PATCH /api/v1/trainers/availability/{id}/
    Update a specific availability slot

    DELETE /api/v1/trainers/availability/{id}/
    Delete a specific availability slot
    """
    permission_classes = [IsAuthenticated, IsTrainer]

    def get(self, request, slot_id):
        """Get a specific availability slot"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
            slot = AvailabilitySlot.objects.get(id=slot_id, trainer=profile)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except AvailabilitySlot.DoesNotExist:
            return Response(
                {'error': 'Availability slot not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AvailabilitySlotSerializer(slot)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slot_id):
        """Update an availability slot"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
            slot = AvailabilitySlot.objects.get(id=slot_id, trainer=profile)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except AvailabilitySlot.DoesNotExist:
            return Response(
                {'error': 'Availability slot not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AvailabilitySlotSerializer(slot, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slot_id):
        """Delete an availability slot"""
        try:
            profile = TrainerProfile.objects.get(user=request.user)
            slot = AvailabilitySlot.objects.get(id=slot_id, trainer=profile)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except AvailabilitySlot.DoesNotExist:
            return Response(
                {'error': 'Availability slot not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        slot.delete()
        return Response(
            {'message': 'Availability slot deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


class TrainerAvailabilityPublicView(APIView):
    """
    GET /api/v1/trainers/{trainer_id}/availability/
    Public endpoint to view a trainer's availability (for booking)
    """
    permission_classes = []  # Public endpoint

    def get(self, request, trainer_id):
        """Get availability for a specific trainer"""
        try:
            trainer = TrainerProfile.objects.get(id=trainer_id, published=True)
        except TrainerProfile.DoesNotExist:
            return Response(
                {'error': 'Trainer not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        slots = AvailabilitySlot.objects.filter(
            trainer=trainer,
            is_available=True
        ).order_by('day_of_week', 'start_time')

        serializer = AvailabilitySlotSerializer(slots, many=True)

        return Response({
            'trainer_id': trainer.id,
            'trainer_name': f"{trainer.user.first_name} {trainer.user.last_name}",
            'availability_slots': serializer.data
        }, status=status.HTTP_200_OK)
