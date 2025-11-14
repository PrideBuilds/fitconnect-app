import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api'
import { Button, Card, Badge } from '../components/ui'
import AvailabilityDisplay from '../components/AvailabilityDisplay'
import BookingModal from '../components/BookingModal'
import ReviewCard from '../components/ReviewCard'
import StarRating from '../components/StarRating'
import { useAuth } from '../contexts/AuthContext'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/**
 * Trainer Detail Page
 * View detailed trainer profile and book sessions
 */
const TrainerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trainer, setTrainer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // Fetch trainer details
  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/trainers/${id}/`)

        if (!response.ok) {
          throw new Error('Trainer not found')
        }

        const data = await response.json()
        setTrainer(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainer()
  }, [id])

  // Fetch trainer reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/trainers/${id}/reviews/`)

        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }

        const data = await response.json()
        setReviews(data.results || data)
      } catch (err) {
        console.error('Error fetching reviews:', err)
        // Don't show error to user - just show no reviews
        setReviews([])
      } finally {
        setReviewsLoading(false)
      }
    }

    if (id) {
      fetchReviews()
    }
  }, [id])

  const handleBookingClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/trainers/${id}` } })
      return
    }

    if (user.role !== 'client') {
      alert('Only clients can book sessions')
      return
    }

    setShowBookingModal(true)
  }

  const handleBookingSuccess = (booking) => {
    setShowBookingModal(false)
    setBookingSuccess(true)

    // Hide success message after 5 seconds
    setTimeout(() => {
      setBookingSuccess(false)
    }, 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading trainer profile...</p>
        </div>
      </div>
    )
  }

  if (error || !trainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <svg
            className="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Trainer Not Found</h3>
          <p className="text-gray-600 mb-4">
            The trainer you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/search')}>Back to Search</Button>
        </Card>
      </div>
    )
  }

  // Get photos by type
  const profilePhoto = trainer.photos?.find((p) => p.photo_type === 'profile')
  const gymPhotos = trainer.photos?.filter((p) => p.photo_type === 'gym') || []
  const actionPhotos = trainer.photos?.filter((p) => p.photo_type === 'action') || []
  const credentialPhotos = trainer.photos?.filter((p) => p.photo_type === 'credentials') || []
  const allPhotos = trainer.photos || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                {profilePhoto?.photo ? (
                  <img
                    src={profilePhoto.photo}
                    alt={`${trainer.user.first_name} ${trainer.user.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Trainer Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {trainer.user.first_name} {trainer.user.last_name}
                    {trainer.verified && (
                      <svg
                        className="inline-block w-8 h-8 ml-2 text-primary-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        title="Verified Trainer"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </h1>

                  {/* Rating */}
                  {trainer.total_reviews > 0 && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center">
                        <svg
                          className="w-6 h-6 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="ml-1 text-lg font-semibold text-gray-900">
                          {parseFloat(trainer.average_rating).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-600">
                        ({trainer.total_reviews} review{trainer.total_reviews !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}

                  {/* Specializations */}
                  {trainer.specializations && trainer.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {trainer.specializations.map((spec) => (
                        <Badge key={spec.id} variant="primary">
                          {spec.icon && <span className="mr-1">{spec.icon}</span>}
                          {spec.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Experience */}
                  {trainer.years_experience > 0 && (
                    <p className="text-gray-600 mb-2">
                      {trainer.years_experience} year{trainer.years_experience !== 1 ? 's' : ''} of
                      experience
                    </p>
                  )}
                </div>

                {/* Pricing */}
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">
                    ${trainer.hourly_rate}
                  </div>
                  <div className="text-gray-600">per hour</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <Button size="lg" className="flex-1" onClick={handleBookingClick}>
                  Book a Session
                </Button>
                <Button variant="outline" size="lg">
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {bookingSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-green-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-green-800">Booking Request Sent Successfully!</p>
                <p className="text-sm text-green-700">
                  The trainer will review your request and confirm soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {trainer.bio && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {trainer.bio}
                </p>
              </Card>
            )}

            {/* Photo Gallery */}
            {allPhotos.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Photos</h2>

                {/* Main Photo */}
                <div className="mb-4 rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={allPhotos[selectedPhotoIndex]?.photo}
                    alt={allPhotos[selectedPhotoIndex]?.caption || 'Trainer photo'}
                    className="w-full h-96 object-cover"
                  />
                </div>

                {/* Photo Thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {allPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPhotoIndex === index
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={photo.photo}
                        alt={photo.caption || 'Thumbnail'}
                        className="w-full h-24 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Certifications */}
            {trainer.certifications && trainer.certifications.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Certifications & Credentials
                </h2>
                <div className="space-y-3">
                  {trainer.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                          <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                          {cert.credential_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {cert.credential_id}
                            </p>
                          )}
                        </div>
                        {cert.is_expired ? (
                          <Badge variant="secondary" className="text-red-600 bg-red-50">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reviews Section */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reviews ({trainer.total_reviews})
                </h2>
                {trainer.total_reviews > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={parseFloat(trainer.average_rating)} readonly size="md" />
                    <span className="text-lg font-semibold text-gray-900">
                      {parseFloat(trainer.average_rating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p>No reviews yet. Be the first to book and review!</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book a Session</h3>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  ${trainer.hourly_rate}
                </div>
                <div className="text-sm text-gray-600">per hour</div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Flexible scheduling
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {trainer.service_radius_miles}-mile service radius
                </div>
                {trainer.verified && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified & background checked
                  </div>
                )}
              </div>

              <Button size="lg" fullWidth className="mb-3" onClick={handleBookingClick}>
                Check Availability
              </Button>
              <Button variant="outline" size="lg" fullWidth>
                Send Message
              </Button>
            </Card>

            {/* Availability Card */}
            <AvailabilityDisplay trainerId={trainer.id} />

            {/* Location Card with Map */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
              <p className="text-gray-600 text-sm mb-3">{trainer.address}</p>
              <p className="text-sm text-gray-500 mb-4">
                Serves clients within {trainer.service_radius_miles} miles
              </p>

              {/* Google Map */}
              {trainer.location && trainer.location.coordinates && GOOGLE_MAPS_API_KEY && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={{
                        width: '100%',
                        height: '250px',
                      }}
                      center={{
                        lat: trainer.location.coordinates[1],  // GeoJSON: [lng, lat]
                        lng: trainer.location.coordinates[0],
                      }}
                      zoom={12}
                      options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                      }}
                    >
                      {/* Trainer Location Marker */}
                      <Marker
                        position={{
                          lat: trainer.location.coordinates[1],
                          lng: trainer.location.coordinates[0],
                        }}
                        title={`${trainer.user.first_name} ${trainer.user.last_name}`}
                      />

                      {/* Service Radius Circle */}
                      <Circle
                        center={{
                          lat: trainer.location.coordinates[1],
                          lng: trainer.location.coordinates[0],
                        }}
                        radius={trainer.service_radius_miles * 1609.34} // Convert miles to meters
                        options={{
                          strokeColor: '#3B82F6',
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          fillColor: '#3B82F6',
                          fillOpacity: 0.15,
                        }}
                      />
                    </GoogleMap>
                  </LoadScript>
                </div>
              )}

              {!trainer.location && (
                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 text-sm">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Map preview not available
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          trainer={trainer}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  )
}

export default TrainerDetail
