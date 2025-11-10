import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Badge } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Client Bookings Dashboard
 * View and manage training session bookings
 */
const ClientBookings = () => {
  const navigate = useNavigate()
  const { tokens } = useAuth()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, completed, cancelled
  const [cancellingBookingId, setCancellingBookingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

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

      // Build URL with filter
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

  const handleCancelBooking = async (bookingId) => {
    try {
      if (!tokens?.access) {
        alert('You must be logged in to cancel bookings')
        return
      }

      const response = await fetch(`http://localhost:8000/api/v1/bookings/${bookingId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel booking')
      }

      // Refresh bookings
      fetchBookings()
      setCancellingBookingId(null)
      setCancelReason('')
      alert('Booking cancelled successfully')
    } catch (err) {
      alert(err.message)
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
        return 'Pending Confirmation'
      case 'confirmed':
        return 'Confirmed'
      case 'completed':
        return 'Completed'
      case 'cancelled_by_client':
        return 'Cancelled by You'
      case 'cancelled_by_trainer':
        return 'Cancelled by Trainer'
      case 'no_show':
        return 'No Show'
      default:
        return status
    }
  }

  const canCancelBooking = (booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return false
    }

    // Check if booking is more than 24 hours away
    const sessionDateTime = new Date(`${booking.session_date}T${booking.start_time}`)
    const now = new Date()
    const hoursDifference = (sessionDateTime - now) / (1000 * 60 * 60)

    return hoursDifference >= 24
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
          <p className="text-gray-600 mt-1">View and manage your training sessions</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled_by_client'].map((status) => (
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
              {status === 'cancelled_by_client' && 'Cancelled'}
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
            <Button onClick={() => navigate('/search')}>Find a Trainer</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.trainer.user.first_name} {booking.trainer.user.last_name}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(booking.status)} className="mt-1">
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${parseFloat(booking.total_price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
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
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-700">
                            {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}{' '}
                            ({booking.duration_minutes} min)
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium text-gray-900">{booking.location_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Client Notes */}
                    {booking.client_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600 mb-1">Your Notes:</p>
                        <p className="text-sm text-gray-900">{booking.client_notes}</p>
                      </div>
                    )}

                    {/* Trainer Notes (if confirmed) */}
                    {booking.trainer_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-600 mb-1">Trainer Notes:</p>
                        <p className="text-sm text-blue-900">{booking.trainer_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:min-w-[200px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/trainers/${booking.trainer.id}`)
                      }
                    >
                      View Trainer
                    </Button>

                    {canCancelBooking(booking) && (
                      <>
                        {cancellingBookingId === booking.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Cancellation reason (optional)"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCancellingBookingId(null)
                                  setCancelReason('')
                                }}
                              >
                                Back
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => handleCancelBooking(booking.id)}
                              >
                                Confirm Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => setCancellingBookingId(booking.id)}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </>
                    )}

                    {!canCancelBooking(booking) &&
                      ['pending', 'confirmed'].includes(booking.status) && (
                        <p className="text-xs text-gray-500 text-center">
                          Cannot cancel (less than 24h before session)
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

export default ClientBookings
