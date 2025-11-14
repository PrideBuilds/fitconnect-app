import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Button } from '../ui'

/**
 * Trainer Detail Modal
 * Display comprehensive trainer information for admin review
 */
const TrainerDetailModal = ({ trainerId, isOpen, onClose, onTrainerUpdated, tokens }) => {
  const [trainer, setTrainer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && trainerId) {
      fetchTrainerDetails()
    }
  }, [isOpen, trainerId])

  const fetchTrainerDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`http://localhost:8000/api/v1/admin/trainers/${trainerId}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trainer details')
      }

      const data = await response.json()
      setTrainer(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (action) => {
    const confirmMessage =
      action === 'approve'
        ? `Approve ${trainer.user.first_name} ${trainer.user.last_name}'s trainer profile?`
        : `Reject ${trainer.user.first_name} ${trainer.user.last_name}'s trainer profile?`

    if (!window.confirm(confirmMessage)) return

    try {
      setActionLoading(true)

      const response = await fetch(
        `http://localhost:8000/api/v1/admin/trainers/${trainerId}/approve/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} trainer`)
      }

      alert(`Trainer ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      onTrainerUpdated()
      await fetchTrainerDetails() // Refresh data
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Trainer Profile Review</h2>
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
              <p className="mt-4 text-gray-600">Loading trainer details...</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Trainer</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : trainer ? (
            <>
              {/* User Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {trainer.user.first_name} {trainer.user.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{trainer.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Username</p>
                    <p className="text-base font-medium text-gray-900">@{trainer.user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {trainer.user.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(trainer.user.date_joined).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Verified</p>
                    {trainer.user.email_verified ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Hourly Rate</p>
                    <p className="text-base font-medium text-gray-900">
                      {trainer.hourly_rate ? `$${trainer.hourly_rate}/hr` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Years of Experience</p>
                    <p className="text-base font-medium text-gray-900">{trainer.years_experience || 0} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service Radius</p>
                    <p className="text-base font-medium text-gray-900">
                      {trainer.service_radius_miles || 0} miles
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-base font-medium text-gray-900">
                      {trainer.average_rating ? `${trainer.average_rating.toFixed(1)} (${trainer.total_reviews} reviews)` : 'No reviews yet'}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {trainer.address && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-base font-medium text-gray-900">{trainer.address}</p>
                  </div>
                )}

                {/* Bio */}
                {trainer.bio && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Bio</p>
                    <p className="text-base text-gray-900">{trainer.bio}</p>
                  </div>
                )}
              </div>

              {/* Specializations */}
              {trainer.specializations && trainer.specializations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specializations.map((spec) => (
                      <span
                        key={spec.id}
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {trainer.certifications && trainer.certifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                  <div className="space-y-2">
                    {trainer.certifications.map((cert, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-900">{cert.name}</p>
                        <p className="text-sm text-gray-600">
                          {cert.issuing_organization} • {cert.year_obtained}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {trainer.photos && trainer.photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {trainer.photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || photo.photo_type}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="capitalize">{photo.photo_type}</span>
                          {photo.caption && ` - ${photo.caption}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{trainer.statistics.total_bookings}</p>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{trainer.statistics.completed_bookings}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      ${trainer.statistics.total_revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              </div>

              {/* Profile Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {trainer.published ? (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                      Pending Approval
                    </span>
                  )}
                  {trainer.verified && (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Verified
                    </span>
                  )}
                  {trainer.profile_complete ? (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Profile Complete
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Profile Incomplete
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {trainer.profile_complete && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
                  <div className="flex gap-3">
                    {!trainer.published ? (
                      <>
                        <Button
                          onClick={() => handleApproveReject('approve')}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {actionLoading ? 'Processing...' : 'Approve Trainer'}
                        </Button>
                        <Button
                          onClick={() => handleApproveReject('reject')}
                          disabled={actionLoading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {actionLoading ? 'Processing...' : 'Reject Profile'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleApproveReject('reject')}
                        disabled={actionLoading}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        {actionLoading ? 'Processing...' : 'Unpublish Trainer'}
                      </Button>
                    )}
                  </div>
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

TrainerDetailModal.propTypes = {
  trainerId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onTrainerUpdated: PropTypes.func.isRequired,
  tokens: PropTypes.shape({
    access: PropTypes.string.isRequired,
  }).isRequired,
}

export default TrainerDetailModal
