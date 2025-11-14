import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Button } from '../ui'

/**
 * User Detail Modal
 * Display detailed user information and management actions
 */
const UserDetailModal = ({ userId, isOpen, onClose, onUserUpdated, tokens }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails()
    }
  }, [isOpen, userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }

      const data = await response.json()
      setUser(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      setActionLoading(true)

      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      // Refresh user details
      await fetchUserDetails()
      onUserUpdated()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${user.username}? This will disable their account.`
    )

    if (!confirmed) return

    try {
      setActionLoading(true)

      const response = await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      alert('User deactivated successfully')
      onUserUpdated()
      onClose()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Details</h2>
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
              <p className="mt-4 text-gray-600">Loading user details...</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading User</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : user ? (
            <>
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Username</p>
                    <p className="text-base font-medium text-gray-900">@{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-base font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'trainer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-base font-medium text-gray-900">{user.bookings_count}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    {user.is_active ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email Verification</p>
                    {user.email_verified ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Unverified
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Joined</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Login</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              {user.profile && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {user.role === 'client' ? 'Client Profile' : 'Trainer Profile'}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {user.role === 'client' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Profile Complete</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.profile_complete ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fitness Level</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.fitness_level || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Primary Goal</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.primary_goal || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.location || 'Not set'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Published</p>
                          {user.profile.published ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Verified</p>
                          {user.profile.verified ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.hourly_rate ? `$${user.profile.hourly_rate}/hr` : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.years_experience || 0} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Average Rating</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.average_rating ? user.profile.average_rating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Reviews</p>
                          <p className="text-base font-medium text-gray-900">
                            {user.profile.total_reviews || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={handleToggleActive}
                    disabled={actionLoading}
                    variant={user.is_active ? 'outline' : 'primary'}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : user.is_active ? 'Suspend User' : 'Activate User'}
                  </Button>
                  <Button
                    onClick={handleDeleteUser}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {actionLoading ? 'Processing...' : 'Deactivate Account'}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  ) : null
}

UserDetailModal.propTypes = {
  userId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUserUpdated: PropTypes.func.isRequired,
  tokens: PropTypes.shape({
    access: PropTypes.string.isRequired,
  }).isRequired,
}

export default UserDetailModal
