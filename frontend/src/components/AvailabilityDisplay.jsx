import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card } from './ui'

/**
 * Availability Display Component
 * Shows trainer's weekly availability for clients
 */
const AvailabilityDisplay = ({ trainerId }) => {
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const DAYS_OF_WEEK = [
    { value: 0, label: 'Mon', fullLabel: 'Monday' },
    { value: 1, label: 'Tue', fullLabel: 'Tuesday' },
    { value: 2, label: 'Wed', fullLabel: 'Wednesday' },
    { value: 3, label: 'Thu', fullLabel: 'Thursday' },
    { value: 4, label: 'Fri', fullLabel: 'Friday' },
    { value: 5, label: 'Sat', fullLabel: 'Saturday' },
    { value: 6, label: 'Sun', fullLabel: 'Sunday' },
  ]

  useEffect(() => {
    fetchAvailability()
  }, [trainerId])

  const fetchAvailability = async () => {
    try {
      setLoading(true)

      const response = await fetch(
        `http://localhost:8000/api/v1/trainers/${trainerId}/availability/`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()
      setAvailability(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading availability...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p>Could not load availability</p>
        </div>
      </Card>
    )
  }

  if (!availability || availability.availability_slots.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Availability</h3>
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
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
          <p>No availability set yet</p>
          <p className="text-sm mt-1">Contact trainer for scheduling</p>
        </div>
      </Card>
    )
  }

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    slots: availability.availability_slots.filter(
      (slot) => slot.day_of_week === day.value && slot.is_available
    ),
  }))

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Availability</h3>
      <p className="text-sm text-gray-600 mb-6">
        Typical weekly schedule. Specific dates may vary.
      </p>

      <div className="space-y-3">
        {slotsByDay.map((day) => (
          <div
            key={day.value}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              {/* Day indicator */}
              <div className="w-12 text-center">
                <div className="text-sm font-semibold text-gray-900">{day.label}</div>
              </div>

              {/* Time slots */}
              {day.slots.length === 0 ? (
                <span className="text-sm text-gray-400">Not available</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => (
                    <span
                      key={slot.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {slot.start_time} - {slot.end_time}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          All times displayed in your local timezone
        </p>
      </div>
    </Card>
  )
}

AvailabilityDisplay.propTypes = {
  trainerId: PropTypes.number.isRequired,
}

export default AvailabilityDisplay
