import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Button } from '../ui'

/**
 * Booking Detail Modal
 * Display comprehensive booking information and management actions
 */
const BookingDetailModal = ({ bookingId, isOpen, onClose, onBookingUpdated, tokens }) => {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchBookingDetails()
    }
  }, [isOpen, bookingId])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`http://localhost:8000/api/v1/admin/bookings/${bookingId}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch booking details')
      }

      const data = await response.json()
      setBooking(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a cancellation reason')
      return
    }

    const confirmMessage = `Cancel this booking? This action cannot be undone.`
    if (!window.confirm(confirmMessage)) return

    try {
      setActionLoading(true)

      const response = await fetch(
        `http://localhost:8000/api/v1/admin/bookings/${bookingId}/cancel/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: cancellationReason }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel booking')
      }

      alert('Booking cancelled successfully')
      setCancellationReason('')
      setShowCancelForm(false)
      onBookingUpdated()
      await fetchBookingDetails() // Refresh data
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled_by_client: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled by Client' },
      cancelled_by_trainer: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled by Trainer' },
      no_show: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'No Show' },
    }

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading booking details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Booking</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : booking ? (
            <>
              {/* Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                {getStatusBadge(booking.status)}
              </div>

              {/* Session Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Session Date & Time</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(booking.session_datetime).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-base font-medium text-gray-900">{booking.duration_minutes} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Session Type</p>
                    <p className="text-base font-medium text-gray-900 capitalize">
                      {booking.session_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Booked On</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(booking.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trainer Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.trainer.first_name} {booking.trainer.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-base font-medium text-gray-900">{booking.trainer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.trainer.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="text-base font-medium text-gray-900">@{booking.trainer.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.client.first_name} {booking.client.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-base font-medium text-gray-900">{booking.client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.client.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="text-base font-medium text-gray-900">@{booking.client.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Pricing */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-base font-medium text-gray-900">{booking.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="text-base font-medium text-gray-900">${booking.total_price}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Requests</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{booking.notes}</p>
                  </div>
                </div>
              )}

              {/* Cancellation Info */}
              {(booking.status === 'cancelled_by_client' || booking.status === 'cancelled_by_trainer') && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancellation Information</h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-2">
                      {booking.cancelled_at && (
                        <div>
                          <p className="text-sm text-gray-600">Cancelled At</p>
                          <p className="text-base font-medium text-gray-900">
                            {new Date(booking.cancelled_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {booking.cancellation_reason && (
                        <div>
                          <p className="text-sm text-gray-600">Reason</p>
                          <p className="text-base font-medium text-gray-900">{booking.cancellation_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {booking.status !== 'cancelled_by_client' && booking.status !== 'cancelled_by_trainer' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>

                  {!showCancelForm ? (
                    <Button
                      onClick={() => setShowCancelForm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Cancel Booking
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-2">
                          Cancellation Reason
                        </label>
                        <textarea
                          id="cancellation-reason"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter reason for cancellation..."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCancelBooking}
                          disabled={actionLoading}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {actionLoading ? 'Processing...' : 'Confirm Cancellation'}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCancelForm(false)
                            setCancellationReason('')
                          }}
                          disabled={actionLoading}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end sticky bottom-0">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  ) : null
}

BookingDetailModal.propTypes = {
  bookingId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onBookingUpdated: PropTypes.func.isRequired,
  tokens: PropTypes.shape({
    access: PropTypes.string.isRequired,
  }).isRequired,
}

export default BookingDetailModal
