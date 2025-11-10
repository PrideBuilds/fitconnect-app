# TASK-006: Profile Creation Form with Photo Uploads

**Epic:** Phase 1 - Sprint 2 (Week 2) - Trainer Profiles
**Complexity:** Large (8 hours)
**Dependencies:** TASK-005 (Trainer Profile Models)
**Assignee:** Frontend Developer
**Status:** Ready

---

## Overview

Build a multi-step profile creation wizard for trainers to complete their profiles with photo uploads, specialization selection, bio, experience, location, and pricing information. This form integrates with the TrainerProfile API created in TASK-005.

---

## Sub-Tasks

- [ ] 1. Create multi-step form component structure
  - Install react-hook-form for form management
  - Create wizard navigation (Step 1, 2, 3, 4)
  - Add progress indicator
  - Verify: Form renders with step navigation

- [ ] 2. Build Step 1: Basic Information
  - Bio textarea (max 500 characters)
  - Years of experience input (0-50)
  - Character counter for bio
  - Validation rules
  - Test: Form validation works

- [ ] 3. Build Step 2: Specializations
  - Fetch specializations from API
  - Multi-select checkbox interface
  - Display icons with specialization names
  - Require at least 1 selection
  - Test: Can select/deselect specializations

- [ ] 4. Build Step 3: Location & Service
  - Address input field
  - Service radius slider (1-50 miles)
  - Visual radius display
  - Map preview (placeholder for TASK-007)
  - Test: Address and radius save correctly

- [ ] 5. Build Step 4: Pricing
  - Hourly rate input ($0-500)
  - Currency formatting
  - Rate preview display
  - Test: Valid price range enforced

- [ ] 6. Build photo upload component
  - Drag-and-drop file input
  - Click to browse
  - Image preview before upload
  - File type validation (jpg, png, webp)
  - File size validation (max 10MB)
  - Multiple file support
  - Test: Upload UI works

- [ ] 7. Implement photo upload to backend
  - POST to /api/v1/trainers/profile/photos/
  - Progress indicator during upload
  - Error handling for failed uploads
  - Display uploaded photos
  - Delete photo functionality
  - Test: Photos upload successfully

- [ ] 8. Create profile submission logic
  - Collect all form data
  - POST to /api/v1/trainers/profile/
  - Handle validation errors
  - Success redirect to profile view
  - Test: Profile creates successfully

- [ ] 9. Add form persistence
  - Save draft to localStorage
  - Auto-save on field change
  - Restore on page reload
  - Clear on successful submission
  - Test: Form data persists

- [ ] 10. Build profile completion indicator
  - Check required fields
  - Display completion percentage
  - Visual progress bar
  - Missing fields list
  - Test: Indicator updates correctly

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
cd frontend
npm install react-hook-form
npm install react-dropzone  # For drag-and-drop upload
```

### Step 2: Create Multi-Step Form Structure

**File: `frontend/src/components/profile/ProfileWizard.jsx`**

```jsx
import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import BasicInfoStep from './steps/BasicInfoStep'
import SpecializationsStep from './steps/SpecializationsStep'
import LocationStep from './steps/LocationStep'
import PricingStep from './steps/PricingStep'
import PhotosStep from './steps/PhotosStep'

const STEPS = [
  { id: 1, name: 'Basic Info', component: BasicInfoStep },
  { id: 2, name: 'Specializations', component: SpecializationsStep },
  { id: 3, name: 'Location', component: LocationStep },
  { id: 4, name: 'Pricing', component: PricingStep },
  { id: 5, name: 'Photos', component: PhotosStep },
]

const ProfileWizard = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      bio: '',
      years_experience: 0,
      specialization_ids: [],
      address: '',
      service_radius_miles: 10,
      hourly_rate: 0,
      photos: [],
    },
  })

  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Create profile
      const response = await fetch('http://localhost:8000/api/v1/trainers/profile/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: data.bio,
          years_experience: data.years_experience,
          specialization_ids: data.specialization_ids,
          address: data.address,
          service_radius_miles: data.service_radius_miles,
          hourly_rate: data.hourly_rate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      const profile = await response.json()

      // Upload photos
      for (const photo of data.photos) {
        const formData = new FormData()
        formData.append('photo', photo.file)
        formData.append('photo_type', photo.type)
        formData.append('caption', photo.caption || '')

        await fetch(`http://localhost:8000/api/v1/trainers/profile/${profile.id}/photos/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
          },
          body: formData,
        })
      }

      // Clear localStorage draft
      localStorage.removeItem('profileDraft')

      // Redirect to profile view
      navigate('/trainer/profile')
    } catch (error) {
      console.error('Profile creation error:', error)
      alert('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  step.id === currentStep
                    ? 'text-blue-600 font-semibold'
                    : step.id < currentStep
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div className="text-sm">{step.name}</div>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
              <CurrentStepComponent />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}

export default ProfileWizard
```

### Step 3: Create Form Steps

**File: `frontend/src/components/profile/steps/BasicInfoStep.jsx`**

```jsx
import { useFormContext } from 'react-hook-form'

const BasicInfoStep = () => {
  const { register, watch, formState: { errors } } = useFormContext()
  const bio = watch('bio', '')

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

      <div className="mb-6">
        <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">
          Bio *
          <span className="text-sm text-gray-500 ml-2">
            ({bio.length}/500 characters)
          </span>
        </label>
        <textarea
          id="bio"
          {...register('bio', {
            required: 'Bio is required',
            maxLength: {
              value: 500,
              message: 'Bio must be less than 500 characters',
            },
          })}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell clients about your training philosophy, experience, and approach..."
        />
        {errors.bio && (
          <p className="text-red-600 text-sm mt-1">{errors.bio.message}</p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="years_experience" className="block text-gray-700 font-medium mb-2">
          Years of Experience *
        </label>
        <input
          type="number"
          id="years_experience"
          {...register('years_experience', {
            required: 'Experience is required',
            min: { value: 0, message: 'Must be at least 0' },
            max: { value: 50, message: 'Must be less than 50' },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.years_experience && (
          <p className="text-red-600 text-sm mt-1">{errors.years_experience.message}</p>
        )}
      </div>
    </div>
  )
}

export default BasicInfoStep
```

**File: `frontend/src/components/profile/steps/SpecializationsStep.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

const SpecializationsStep = () => {
  const { register, watch, setValue } = useFormContext()
  const [specializations, setSpecializations] = useState([])
  const selectedIds = watch('specialization_ids', [])

  useEffect(() => {
    // Fetch specializations from API
    fetch('http://localhost:8000/api/v1/trainers/specializations/')
      .then((res) => res.json())
      .then((data) => setSpecializations(data))
      .catch((err) => console.error('Failed to fetch specializations:', err))
  }, [])

  const toggleSpecialization = (id) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id]
    setValue('specialization_ids', newSelection)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Specializations</h2>
      <p className="text-gray-600 mb-6">Select your areas of expertise (choose at least 1)</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {specializations.map((spec) => (
          <div
            key={spec.id}
            onClick={() => toggleSpecialization(spec.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedIds.includes(spec.id)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="text-3xl mb-2">{spec.icon}</div>
            <div className="font-semibold text-gray-900">{spec.name}</div>
            <div className="text-sm text-gray-600 mt-1">{spec.description}</div>
          </div>
        ))}
      </div>

      {selectedIds.length === 0 && (
        <p className="text-red-600 text-sm mt-4">Please select at least one specialization</p>
      )}
    </div>
  )
}

export default SpecializationsStep
```

**File: `frontend/src/components/profile/steps/LocationStep.jsx`**

```jsx
import { useFormContext } from 'react-hook-form'

const LocationStep = () => {
  const { register, watch, formState: { errors } } = useFormContext()
  const radius = watch('service_radius_miles', 10)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Location & Service Area</h2>

      <div className="mb-6">
        <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
          Address *
        </label>
        <input
          type="text"
          id="address"
          {...register('address', {
            required: 'Address is required',
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123 Fitness St, San Francisco, CA 94102"
        />
        {errors.address && (
          <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          This will be geocoded in the next task (TASK-007)
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="service_radius_miles" className="block text-gray-700 font-medium mb-2">
          Service Radius: {radius} miles
        </label>
        <input
          type="range"
          id="service_radius_miles"
          {...register('service_radius_miles')}
          min="1"
          max="50"
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>1 mile</span>
          <span>50 miles</span>
        </div>
      </div>
    </div>
  )
}

export default LocationStep
```

**File: `frontend/src/components/profile/steps/PricingStep.jsx`**

```jsx
import { useFormContext } from 'react-hook-form'

const PricingStep = () => {
  const { register, watch, formState: { errors } } = useFormContext()
  const rate = watch('hourly_rate', 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing</h2>

      <div className="mb-6">
        <label htmlFor="hourly_rate" className="block text-gray-700 font-medium mb-2">
          Hourly Rate *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-2.5 text-gray-600 text-lg">$</span>
          <input
            type="number"
            id="hourly_rate"
            {...register('hourly_rate', {
              required: 'Hourly rate is required',
              min: { value: 1, message: 'Rate must be at least $1' },
              max: { value: 500, message: 'Rate must be less than $500' },
            })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="75"
          />
        </div>
        {errors.hourly_rate && (
          <p className="text-red-600 text-sm mt-1">{errors.hourly_rate.message}</p>
        )}
      </div>

      {rate > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Rate Preview</h3>
          <div className="text-blue-800">
            <div>1 hour session: ${rate}</div>
            <div>1.5 hour session: ${(rate * 1.5).toFixed(2)}</div>
            <div>2 hour session: ${(rate * 2).toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingStep
```

**File: `frontend/src/components/profile/steps/PhotosStep.jsx`**

```jsx
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'

const PhotosStep = () => {
  const { setValue, watch } = useFormContext()
  const photos = watch('photos', [])
  const [previews, setPreviews] = useState([])

  const onDrop = (acceptedFiles) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      type: 'gym', // Default type
      caption: '',
      preview: URL.createObjectURL(file),
    }))

    setValue('photos', [...photos, ...newPhotos])
    setPreviews([...previews, ...newPhotos.map((p) => p.preview)])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setValue('photos', newPhotos)
    setPreviews(previews.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Photos</h2>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-gray-600">
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <>
              <p className="mb-2">Drag & drop photos here, or click to select</p>
              <p className="text-sm">Accepts JPG, PNG, WebP (max 10MB each)</p>
            </>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {photos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <div className="mt-2">
                <select
                  value={photo.type}
                  onChange={(e) => {
                    const newPhotos = [...photos]
                    newPhotos[index].type = e.target.value
                    setValue('photos', newPhotos)
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="profile">Profile Photo</option>
                  <option value="gym">Training Space</option>
                  <option value="credentials">Credentials</option>
                  <option value="action">Training Session</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-gray-500 mt-4">
          Note: At least one profile photo is recommended
        </p>
      )}
    </div>
  )
}

export default PhotosStep
```

### Step 4: Create API Endpoints (Backend)

**File: `backend/trainers/views.py`** (create new file):

```python
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import TrainerProfile, Specialization, TrainerPhoto
from .serializers import (
    TrainerProfileSerializer,
    SpecializationSerializer,
    TrainerPhotoSerializer,
)
from users.permissions import IsTrainer


class SpecializationListView(generics.ListAPIView):
    """Public list of all specializations"""
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [permissions.AllowAny]


class TrainerProfileCreateUpdateView(generics.RetrieveUpdateAPIView):
    """Create or update trainer profile"""
    serializer_class = TrainerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsTrainer]

    def get_object(self):
        # Get or create profile for current user
        profile, created = TrainerProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile

    def post(self, request, *args, **kwargs):
        # Allow POST to create/update
        return self.update(request, *args, **kwargs)


class TrainerPhotoUploadView(generics.CreateAPIView):
    """Upload trainer photos"""
    serializer_class = TrainerPhotoSerializer
    permission_classes = [permissions.IsAuthenticated, IsTrainer]

    def perform_create(self, serializer):
        # Get trainer's profile
        profile = TrainerProfile.objects.get(user=self.request.user)
        serializer.save(trainer=profile)
```

**File: `backend/trainers/urls.py`** (create new file):

```python
from django.urls import path
from . import views

app_name = 'trainers'

urlpatterns = [
    path('specializations/', views.SpecializationListView.as_view(), name='specializations'),
    path('profile/', views.TrainerProfileCreateUpdateView.as_view(), name='profile'),
    path('profile/photos/', views.TrainerPhotoUploadView.as_view(), name='photo_upload'),
]
```

**Update `backend/fitconnect/urls.py`**:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/trainers/', include('trainers.urls')),  # Add this
]
```

### Step 5: Add Route to Frontend

**Update `frontend/src/App.jsx`**:

```jsx
import ProfileWizard from './components/profile/ProfileWizard'

// ... in routes:
<Route
  path="/trainer/profile/create"
  element={
    <ProtectedRoute requiredRole="trainer">
      <ProfileWizard />
    </ProtectedRoute>
  }
/>
```

---

## Acceptance Criteria

- [x] Multi-step wizard displays with 5 steps
- [x] Progress indicator shows current step
- [x] All form fields have validation
- [x] Specializations load from API
- [x] Photo upload supports drag-and-drop
- [x] Photo preview displays before upload
- [x] Form data persists in localStorage (draft)
- [x] Profile creates successfully via API
- [x] Photos upload to backend
- [x] Success redirects to profile view
- [x] Error messages display for invalid input

---

## Test Cases

### Test 1: Form Navigation

```
1. Visit /trainer/profile/create
2. Verify Step 1 (Basic Info) displays
3. Click "Next" without filling fields
4. Verify validation errors show
5. Fill valid data, click "Next"
6. Verify Step 2 (Specializations) displays
7. Click "Previous"
8. Verify returns to Step 1 with data intact
```

### Test 2: Specializations Selection

```
1. Navigate to Step 2
2. Verify specializations load from API
3. Click 3 different specializations
4. Verify selected items highlight
5. Click one again to deselect
6. Verify deselection works
7. Try to proceed with 0 selections
8. Verify error message displays
```

### Test 3: Photo Upload

```
1. Navigate to Step 5 (Photos)
2. Drag and drop a JPG file
3. Verify preview displays
4. Verify file type dropdown shows
5. Change type to "Profile Photo"
6. Click remove button
7. Verify photo removes from preview
8. Upload a 15MB file
9. Verify size validation error
```

### Test 4: Complete Profile Creation

```
1. Fill all steps with valid data
2. Upload 2 photos
3. Click "Complete Profile" on Step 5
4. Verify API POST to /api/v1/trainers/profile/
5. Verify photos POST to /api/v1/trainers/profile/photos/
6. Verify redirect to /trainer/profile
7. Check backend: profile exists in database
8. Check backend: 2 photos associated with profile
```

### Test 5: Form Persistence

```
1. Fill Step 1 and Step 2
2. Close browser tab
3. Reopen /trainer/profile/create
4. Verify Step 1 data restored
5. Navigate to Step 2
6. Verify selections restored
7. Complete and submit form
8. Verify localStorage draft cleared
```

---

## Notes

- Photo upload uses local file storage (`MEDIA_ROOT`) for MVP
- Geocoding (converting address to coordinates) will be implemented in TASK-007
- Profile completion indicator can be added later for better UX
- Consider adding image compression before upload in future iteration
- S3 migration can be done in Phase 2 for production

---

**Estimated Time**: 8 hours
**Last Updated**: 2025-11-08
