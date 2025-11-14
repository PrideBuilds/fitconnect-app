import { useState, useEffect } from 'react'
import { Button, Card, Badge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Trainer Bookings Dashboard
 * View and manage incoming booking requests
 */
const TrainerBookings = () => {
  const { tokens } = useAuth()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [processingBookingId, setProcessingBookingId] = useState(null)
  const [trainerNotes, setTrainerNotes] = useState({})
  const [expandedProfiles, setExpandedProfiles] = useState({})

  // Fetch bookings
  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)

      if (!tokens?.access) {
        setError('You must be logged in to view bookings')
        setLoading(false)
        return
      }

      let url = 'http://localhost:8000/api/v1/bookings/'
      if (filter !== 'all') {
        url += `?status=${filter}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.results || data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)

      if (!tokens?.access) {
        alert('You must be logged in to confirm bookings')
        setProcessingBookingId(null)
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/bookings/${bookingId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'confirm',
          trainer_notes: trainerNotes[bookingId] || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to confirm booking')
      }

      alert('Booking confirmed successfully!')
      fetchBookings()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleCompleteBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)

      if (!tokens?.access) {
        alert('You must be logged in')
        setProcessingBookingId(null)
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/bookings/${bookingId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark as completed')
      }

      alert('Booking marked as completed!')
      fetchBookings()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleNoShow = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)

      if (!tokens?.access) {
        alert('You must be logged in')
        setProcessingBookingId(null)
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/bookings/${bookingId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'no_show',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark as no-show')
      }

      alert('Booking marked as no-show')
      fetchBookings()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const toggleProfileExpanded = (bookingId) => {
    setExpandedProfiles(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }))
  }

  const handleCancelBooking = async (bookingId, reason) => {
    try {
      setProcessingBookingId(bookingId)

      if (!tokens?.access) {
        alert('You must be logged in')
        setProcessingBookingId(null)
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/bookings/${bookingId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel booking')
      }

      alert('Booking cancelled successfully')
      fetchBookings()
    } catch (err) {
      alert(err.message)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'primary'
      case 'completed':
        return 'success'
      case 'cancelled_by_client':
      case 'cancelled_by_trainer':
        return 'secondary'
      case 'no_show':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending - Needs Confirmation'
      case 'confirmed':
        return 'Confirmed'
      case 'completed':
        return 'Completed'
      case 'cancelled_by_client':
        return 'Cancelled by Client'
      case 'cancelled_by_trainer':
        return 'Cancelled by You'
      case 'no_show':
        return 'No Show'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your training session bookings</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled_by_trainer'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {status === 'all' && 'All Bookings'}
              {status === 'pending' && 'Pending'}
              {status === 'confirmed' && 'Confirmed'}
              {status === 'completed' && 'Completed'}
              {status === 'cancelled_by_trainer' && 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-4">No bookings found</p>
            <p className="text-gray-500">
              Complete your profile to start receiving booking requests
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <div className="flex flex-col gap-4">
                  {/* Booking Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.client.first_name} {booking.client.last_name}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      {booking.status === 'pending' && (
                        <p className="text-sm text-orange-600 font-medium">
                          ⏱ Waiting for your confirmation
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${parseFloat(booking.total_price).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${booking.hourly_rate ? parseFloat(booking.hourly_rate).toFixed(0) : '0'}/hr × {booking.duration_minutes}min
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-gray-200">
                    {/* Date & Time */}
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.session_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-700">
                          {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{booking.location_address}</p>
                      </div>
                    </div>

                    {/* Client Contact */}
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-2 mt-0.5"
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
                      <div>
                        <p className="text-sm text-gray-600">Client</p>
                        <p className="font-medium text-gray-900">{booking.client.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Notes */}
                  {booking.client_notes && (
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-600 font-medium mb-1">Client Notes:</p>
                      <p className="text-sm text-blue-900">{booking.client_notes}</p>
                    </div>
                  )}

                  {/* Client Fitness Profile */}
                  {booking.client?.fitness_profile && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleProfileExpanded(booking.id)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                      >
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-5 h-5 text-primary-600"
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
                          <span className="font-medium text-gray-900">Client Fitness Profile</span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            expandedProfiles[booking.id] ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {expandedProfiles[booking.id] && (
                        <div className="p-4 space-y-4 bg-white">
                          {/* Basic Info */}
                          {booking.client.fitness_profile.bio && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">About Client</h4>
                              <p className="text-sm text-gray-600">{booking.client.fitness_profile.bio}</p>
                            </div>
                          )}

                          {/* Physical Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {booking.client.fitness_profile.age && (
                              <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-600">Age</p>
                                <p className="text-lg font-semibold text-gray-900">{booking.client.fitness_profile.age}</p>
                              </div>
                            )}
                            {booking.client.fitness_profile.height_inches && (
                              <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-600">Height</p>
                                <p className="text-lg font-semibold text-gray-900">{booking.client.fitness_profile.height_inches}"</p>
                              </div>
                            )}
                            {booking.client.fitness_profile.current_weight_lbs && (
                              <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-600">Weight</p>
                                <p className="text-lg font-semibold text-gray-900">{booking.client.fitness_profile.current_weight_lbs} lbs</p>
                              </div>
                            )}
                            {booking.client.fitness_profile.bmi && (
                              <div className="bg-gray-50 p-3 rounded">
                                <p className="text-xs text-gray-600">BMI</p>
                                <p className="text-lg font-semibold text-gray-900">{booking.client.fitness_profile.bmi}</p>
                              </div>
                            )}
                          </div>

                          {/* Fitness Goals */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {booking.client.fitness_profile.fitness_level && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Fitness Level</h4>
                                <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm capitalize">
                                  {booking.client.fitness_profile.fitness_level}
                                </span>
                              </div>
                            )}
                            {booking.client.fitness_profile.primary_goal && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Primary Goal</h4>
                                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm capitalize">
                                  {booking.client.fitness_profile.primary_goal.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>

                          {booking.client.fitness_profile.secondary_goals && booking.client.fitness_profile.secondary_goals.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Secondary Goals</h4>
                              <div className="flex flex-wrap gap-2">
                                {booking.client.fitness_profile.secondary_goals.map((goal, idx) => (
                                  <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm capitalize">
                                    {goal.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Health Info */}
                          {(booking.client.fitness_profile.health_conditions ||
                            booking.client.fitness_profile.medications ||
                            booking.client.fitness_profile.dietary_restrictions) && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Health Information</h4>
                              <div className="space-y-2">
                                {booking.client.fitness_profile.health_conditions && (
                                  <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                    <p className="text-xs text-yellow-600 font-medium mb-1">Health Conditions</p>
                                    <p className="text-sm text-yellow-900">{booking.client.fitness_profile.health_conditions}</p>
                                  </div>
                                )}
                                {booking.client.fitness_profile.medications && (
                                  <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                                    <p className="text-xs text-purple-600 font-medium mb-1">Medications</p>
                                    <p className="text-sm text-purple-900">{booking.client.fitness_profile.medications}</p>
                                  </div>
                                )}
                                {booking.client.fitness_profile.dietary_restrictions && (
                                  <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                                    <p className="text-xs text-orange-600 font-medium mb-1">Dietary Restrictions</p>
                                    <p className="text-sm text-orange-900">{booking.client.fitness_profile.dietary_restrictions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Emergency Contact */}
                          {booking.client.fitness_profile.emergency_contact_name && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
                              <div className="text-sm text-gray-600">
                                <p><strong>{booking.client.fitness_profile.emergency_contact_name}</strong></p>
                                {booking.client.fitness_profile.emergency_contact_phone && (
                                  <p>Phone: {booking.client.fitness_profile.emergency_contact_phone}</p>
                                )}
                                {booking.client.fitness_profile.emergency_contact_relationship && (
                                  <p>Relationship: {booking.client.fitness_profile.emergency_contact_relationship}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Workout Preferences */}
                          {(booking.client.fitness_profile.preferred_workout_days?.length > 0 ||
                            booking.client.fitness_profile.preferred_workout_times?.length > 0 ||
                            booking.client.fitness_profile.sessions_per_week ||
                            booking.client.fitness_profile.preferred_session_duration ||
                            booking.client.fitness_profile.preferred_training_style) && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Workout Preferences</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {booking.client.fitness_profile.sessions_per_week && (
                                  <div>
                                    <span className="text-gray-600">Sessions/Week:</span>
                                    <span className="ml-2 font-medium text-gray-900">{booking.client.fitness_profile.sessions_per_week}</span>
                                  </div>
                                )}
                                {booking.client.fitness_profile.preferred_session_duration && (
                                  <div>
                                    <span className="text-gray-600">Session Duration:</span>
                                    <span className="ml-2 font-medium text-gray-900">{booking.client.fitness_profile.preferred_session_duration} min</span>
                                  </div>
                                )}
                                {booking.client.fitness_profile.preferred_training_style && (
                                  <div className="md:col-span-2">
                                    <span className="text-gray-600">Training Style:</span>
                                    <span className="ml-2 font-medium text-gray-900">{booking.client.fitness_profile.preferred_training_style}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trainer Notes Section */}
                  {booking.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Notes for Client (Optional)
                      </label>
                      <textarea
                        value={trainerNotes[booking.id] || ''}
                        onChange={(e) =>
                          setTrainerNotes({ ...trainerNotes, [booking.id]: e.target.value })
                        }
                        placeholder="e.g., Please bring water and comfortable workout clothes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {booking.trainer_notes && booking.status !== 'pending' && (
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600 mb-1">Your Notes:</p>
                      <p className="text-sm text-gray-900">{booking.trainer_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={processingBookingId === booking.id}
                        >
                          {processingBookingId === booking.id ? 'Confirming...' : 'Confirm Booking'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => {
                            const reason = prompt('Cancellation reason:')
                            if (reason !== null) handleCancelBooking(booking.id, reason)
                          }}
                          disabled={processingBookingId === booking.id}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {booking.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleCompleteBooking(booking.id)}
                          disabled={processingBookingId === booking.id}
                        >
                          Mark as Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          onClick={() => handleNoShow(booking.id)}
                          disabled={processingBookingId === booking.id}
                        >
                          Mark as No-Show
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => {
                            const reason = prompt('Cancellation reason:')
                            if (reason !== null) handleCancelBooking(booking.id, reason)
                          }}
                          disabled={processingBookingId === booking.id}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {['completed', 'cancelled_by_client', 'cancelled_by_trainer', 'no_show'].includes(
                      booking.status
                    ) && (
                      <p className="text-sm text-gray-500 py-2">
                        This booking is finalized and cannot be modified.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainerBookings
