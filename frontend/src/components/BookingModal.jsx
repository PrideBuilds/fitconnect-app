import { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Card } from './ui'
import { useAuth } from '../contexts/AuthContext'

/**
 * Booking Modal Component
 * Allow clients to book training sessions
 */
const BookingModal = ({ trainer, onClose, onSuccess }) => {
  const { tokens } = useAuth()

  const [formData, setFormData] = useState({
    session_date: '',
    start_time: '',
    duration_minutes: 60,
    location_address: trainer.address || '',
    client_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const DURATION_OPTIONS = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ]

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return ''

    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  const calculatePrice = () => {
    const hourlyRate = parseFloat(trainer.hourly_rate)
    const hours = formData.duration_minutes / 60
    return (hourlyRate * hours).toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!tokens?.access) {
        throw new Error('You must be logged in to book a session')
      }

      const endTime = calculateEndTime(formData.start_time, formData.duration_minutes)

      const response = await fetch('http://localhost:8000/api/v1/bookings/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainer: trainer.id,
          session_date: formData.session_date,
          start_time: formData.start_time,
          end_time: endTime,
          duration_minutes: formData.duration_minutes,
          location_address: formData.location_address,
          client_notes: formData.client_notes,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          const text = await response.text()
          console.error('Error response text:', text)

          // Try to parse as JSON
          try {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorData.detail || Object.values(errorData).flat().join(', ')
          } catch (jsonError) {
            // Not JSON, use text as error message
            errorMessage = text || errorMessage
          }
        } catch (readError) {
          console.error('Failed to read error response:', readError)
        }
        throw new Error(errorMessage)
      }

      const booking = await response.json()
      onSuccess(booking)
    } catch (err) {
      console.error('Booking error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Book a Session</h2>
              <p className="text-gray-600 mt-1">
                with {trainer.user.first_name} {trainer.user.last_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Date *
              </label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                min={minDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <select
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Time Display */}
            {formData.start_time && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Session will run from{' '}
                  <span className="font-semibold text-gray-900">{formData.start_time}</span> to{' '}
                  <span className="font-semibold text-gray-900">
                    {calculateEndTime(formData.start_time, formData.duration_minutes)}
                  </span>
                </p>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                placeholder="Where should the session take place?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Trainer serves within {trainer.service_radius_miles} miles of their location
              </p>
            </div>

            {/* Client Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests or Focus Areas (Optional)
              </label>
              <textarea
                value={formData.client_notes}
                onChange={(e) => setFormData({ ...formData, client_notes: e.target.value })}
                placeholder="e.g., Focus on core strength, recovering from injury, etc."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Price Summary */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Session Duration:</span>
                <span className="font-medium text-gray-900">
                  {formData.duration_minutes} minutes
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium text-gray-900">${trainer.hourly_rate}/hour</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-900">Total Price:</span>
                <span className="text-primary-600">${calculatePrice()}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Booking Information:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your request will be sent to the trainer for confirmation</li>
                    <li>You can cancel free of charge up to 24 hours before the session</li>
                    <li>Payment will be collected after the trainer confirms</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Sending Request...' : 'Request Booking'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

BookingModal.propTypes = {
  trainer: PropTypes.shape({
    id: PropTypes.number.isRequired,
    user: PropTypes.shape({
      first_name: PropTypes.string.isRequired,
      last_name: PropTypes.string.isRequired,
    }).isRequired,
    hourly_rate: PropTypes.string.isRequired,
    address: PropTypes.string,
    service_radius_miles: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

export default BookingModal
