from django.urls import path
from .views import (
    SpecializationListView,
    TrainerProfileView,
    TrainerPhotoUploadView,
    TrainerPhotoDetailView,
    TrainerSearchView,
    TrainerDetailView,
    AvailabilitySlotListView,
    AvailabilitySlotDetailView,
    TrainerAvailabilityPublicView
)

app_name = 'trainers'

urlpatterns = [
    # Specializations
    path('specializations/', SpecializationListView.as_view(), name='specialization-list'),

    # Trainer Search
    path('search/', TrainerSearchView.as_view(), name='search'),

    # Trainer Detail (public view)
    path('<int:trainer_id>/', TrainerDetailView.as_view(), name='trainer-detail'),

    # Trainer Availability (public view)
    path('<int:trainer_id>/availability/', TrainerAvailabilityPublicView.as_view(), name='trainer-availability-public'),

    # Trainer Profile (authenticated)
    path('profile/', TrainerProfileView.as_view(), name='profile'),

    # Photo Upload and Management
    path('profile/photos/', TrainerPhotoUploadView.as_view(), name='photo-upload'),
    path('profile/photos/<int:photo_id>/', TrainerPhotoDetailView.as_view(), name='photo-detail'),

    # Availability Management (authenticated trainers only)
    path('availability/', AvailabilitySlotListView.as_view(), name='availability-list'),
    path('availability/<int:slot_id>/', AvailabilitySlotDetailView.as_view(), name='availability-detail'),
]
