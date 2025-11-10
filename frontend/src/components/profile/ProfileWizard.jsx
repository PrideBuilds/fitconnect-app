import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import BasicInfoStep from './steps/BasicInfoStep'
import SpecializationsStep from './steps/SpecializationsStep'
import LocationStep from './steps/LocationStep'
import PricingStep from './steps/PricingStep'
import PhotosStep from './steps/PhotosStep'
import { ROUTES } from '../../routes'
import { Button, Card, CardContent } from '../ui'

const STEPS = [
  { id: 1, name: 'Basic Info', component: BasicInfoStep },
  { id: 2, name: 'Specializations', component: SpecializationsStep },
  { id: 3, name: 'Location & Service', component: LocationStep },
  { id: 4, name: 'Pricing', component: PricingStep },
  { id: 5, name: 'Photos', component: PhotosStep },
]

const STORAGE_KEY = 'trainer_profile_draft'

const ProfileWizard = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  // Initialize form with react-hook-form
  const methods = useForm({
    mode: 'onBlur',
    defaultValues: {
      bio: '',
      years_experience: 0,
      specialization_ids: [],
      address: '',
      service_radius_miles: 10,
      hourly_rate: '',
    },
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY)
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft)
        Object.keys(parsedDraft).forEach((key) => {
          methods.setValue(key, parsedDraft[key])
        })
      } catch (err) {
        console.error('Failed to load draft:', err)
      }
    }
  }, [methods])

  // Save draft to localStorage on form change
  useEffect(() => {
    const subscription = methods.watch((formData) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    })
    return () => subscription.unsubscribe()
  }, [methods])

  const handleNext = async () => {
    // Validate current step
    const isValid = await methods.trigger()
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = methods.handleSubmit(async (data) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Submit profile data
      const response = await fetch('http://localhost:8000/api/v1/trainers/profile/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }

      // Clear draft from localStorage
      localStorage.removeItem(STORAGE_KEY)

      // Navigate to trainer dashboard
      navigate(ROUTES.TRAINER_DASHBOARD)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  })

  const CurrentStepComponent = STEPS[currentStep - 1].component

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Create Your Trainer Profile</h1>
            <div className="text-sm font-medium text-primary-600">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        currentStep > step.id
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md scale-100'
                          : currentStep === step.id
                          ? 'bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg scale-110'
                          : 'bg-gray-200 text-gray-500 scale-100'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    {currentStep === step.id && (
                      <div className="absolute inset-0 rounded-full bg-secondary-500 animate-ping opacity-20" />
                    )}
                  </div>

                  {/* Connecting Line */}
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-1 mx-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentStep > step.id
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                            : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Step Name */}
                <div
                  className={`mt-3 text-xs font-medium text-center transition-colors duration-300 ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card variant="elevated" className="overflow-hidden">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {STEPS[currentStep - 1].name}
              </h2>
              <p className="text-sm text-gray-600">
                Step {currentStep} of {STEPS.length}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-up">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            <FormProvider {...methods}>
              <form onSubmit={handleSubmit}>
                <div key={currentStep} className="animate-slide-up">
                  <CurrentStepComponent />
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    variant="outline"
                    size="lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Button>

                  <div className="text-sm text-gray-500">
                    Step {currentStep} of {STEPS.length}
                  </div>

                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      variant="primary"
                      size="lg"
                    >
                      Next
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      variant="accent"
                      size="lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isSubmitting ? 'Saving...' : 'Complete Profile'}
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfileWizard
