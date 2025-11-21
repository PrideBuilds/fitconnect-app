import { useState, useEffect } from 'react'
import { Button, Card } from '../ui'
import api from '../../utils/api'

/**
 * Availability Manager Component
 * Allows trainers to set their weekly recurring availability
 */
const AvailabilityManager = () => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state for adding new slot
  const [newSlot, setNewSlot] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
  })

  const DAYS_OF_WEEK = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ]

  // Fetch existing availability slots
  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const data = await api.get(api.endpoints.AVAILABILITY.LIST)
      setSlots(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const data = await api.post(api.endpoints.AVAILABILITY.LIST, newSlot)
      setSlots([...slots, data])

      // Reset form
      setNewSlot({
        day_of_week: 0,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return
    }

    try {
      await api.delete(api.endpoints.AVAILABILITY.DETAIL(slotId))
      setSlots(slots.filter((slot) => slot.id !== slotId))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleSlot = async (slot) => {
    try {
      const data = await api.patch(api.endpoints.AVAILABILITY.DETAIL(slot.id), {
        is_available: !slot.is_available,
      })
      setSlots(slots.map((s) => (s.id === slot.id ? data : s)))
    } catch (err) {
      setError(err.message)
    }
  }

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    slots: slots.filter((slot) => slot.day_of_week === day.value),
  }))

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability Schedule</h2>
        <p className="text-gray-600">
          Set your weekly recurring availability. Clients will only be able to book during these times.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Add New Slot Form */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Availability Slot</h3>
        <form onSubmit={handleAddSlot} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Week
              </label>
              <select
                value={newSlot.day_of_week}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add Time Slot'}
          </Button>
        </form>
      </Card>

      {/* Weekly Schedule Display */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Schedule</h3>

        {slots.length === 0 ? (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>No availability slots set yet</p>
            <p className="text-sm mt-1">Add your first time slot above to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slotsByDay.map((day) => (
              <div key={day.value} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h4 className="font-semibold text-gray-900 mb-2">{day.label}</h4>

                {day.slots.length === 0 ? (
                  <p className="text-sm text-gray-500">Not available</p>
                ) : (
                  <div className="space-y-2">
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          slot.is_available
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              slot.is_available ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          <span className="font-medium text-gray-900">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              slot.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {slot.is_available ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleSlot(slot)}
                            className="text-sm px-3 py-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          >
                            {slot.is_available ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default AvailabilityManager
