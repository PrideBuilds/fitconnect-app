import { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes'

/**
 * Admin Trainer Approval
 * Review and approve/reject trainer profiles
 */
const AdminTrainers = () => {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending') // 'all', 'pending', 'published'
  const [processingId, setProcessingId] = useState(null)

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Fetch trainers
  useEffect(() => {
    fetchTrainers()
  }, [filter, tokens])

  const fetchTrainers = async () => {
    try {
      if (!tokens?.access) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/trainers/', {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trainers')
      }

      const data = await response.json()

      // Ensure we have an array
      let allTrainers = []
      if (Array.isArray(data)) {
        allTrainers = data
      } else if (data.results && Array.isArray(data.results)) {
        allTrainers = data.results
      }

      // Apply filter
      let filtered = allTrainers
      if (filter === 'pending') {
        filtered = allTrainers.filter((t) => !t.published && t.profile_complete)
      } else if (filter === 'published') {
        filtered = allTrainers.filter((t) => t.published)
      }

      setTrainers(filtered)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (trainerId, action) => {
    try {
      setProcessingId(trainerId)

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
        throw new Error(`Failed to ${action} trainer`)
      }

      // Refresh list
      await fetchTrainers()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading trainers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Trainers</h3>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trainer Approval</h1>
              <p className="text-gray-600 mt-1">Review and approve trainer profiles</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'published'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Trainers
            </button>
          </div>
        </Card>

        {/* Trainers Grid */}
        {trainers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainers found</h3>
            <p className="text-gray-600">
              {filter === 'pending'
                ? 'No trainers are pending approval'
                : 'No trainers match your filter'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer) => (
              <Card key={trainer.id} className="p-6">
                {/* Trainer Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {trainer.user?.first_name || trainer.user?.last_name
                      ? `${trainer.user.first_name || ''} ${trainer.user.last_name || ''}`.trim()
                      : trainer.user?.username || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-600">{trainer.user?.username}</p>
                </div>

                {/* Bio */}
                {trainer.bio && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">{trainer.bio}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trainer.hourly_rate ? `$${trainer.hourly_rate}/hr` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trainer.years_experience || 0} yrs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {trainer.average_rating > 0 ? trainer.average_rating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reviews</p>
                    <p className="text-lg font-semibold text-gray-900">{trainer.total_reviews || 0}</p>
                  </div>
                </div>

                {/* Location */}
                {trainer.address && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-700">{trainer.address}</p>
                  </div>
                )}

                {/* Status Badges */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {trainer.verified && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                  {trainer.published ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Published
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  )}
                  {trainer.profile_complete ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Complete
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Incomplete
                    </span>
                  )}
                </div>

                {/* Actions */}
                {!trainer.published && trainer.profile_complete && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReject(trainer.id, 'approve')}
                      disabled={processingId === trainer.id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {processingId === trainer.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApproveReject(trainer.id, 'reject')}
                      disabled={processingId === trainer.id}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {trainer.published && (
                  <button
                    onClick={() => handleApproveReject(trainer.id, 'reject')}
                    disabled={processingId === trainer.id}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {processingId === trainer.id ? 'Processing...' : 'Unpublish'}
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTrainers
