import { useState, useEffect } from 'react'
import { Card, Button } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes'

/**
 * Admin Reviews Management
 * Moderate and manage all platform reviews
 */
const AdminReviews = () => {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Fetch reviews
  useEffect(() => {
    fetchReviews()
  }, [visibilityFilter, page, tokens])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [visibilityFilter])

  const fetchReviews = async () => {
    try {
      if (!tokens?.access) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const params = new URLSearchParams()

      if (visibilityFilter !== 'all') {
        params.append('visibility', visibilityFilter)
      }

      // Add pagination parameters
      params.append('page', page.toString())
      params.append('page_size', pageSize.toString())

      const url = `http://localhost:8000/api/v1/admin/reviews/?${params.toString()}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.results)
      setTotalCount(data.count)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    const action = currentVisibility ? 'hide' : 'show'
    if (!window.confirm(`Are you sure you want to ${action} this review?`)) return

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/reviews/${reviewId}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_visible: !currentVisibility }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update review visibility')
      }

      alert(`Review ${action}n successfully`)
      fetchReviews()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleMarkSpam = async (reviewId) => {
    if (!window.confirm('Mark this review as spam and hide it?')) return

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/admin/reviews/${reviewId}/spam/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark review as spam')
      }

      alert('Review marked as spam and hidden')
      fetchReviews()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Reviews</h3>
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
              <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
              <p className="text-gray-600 mt-1">Manage and moderate platform reviews</p>
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                visibilityFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Reviews ({totalCount})
            </button>
            <button
              onClick={() => setVisibilityFilter('visible')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                visibilityFilter === 'visible'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visible
            </button>
            <button
              onClick={() => setVisibilityFilter('hidden')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                visibilityFilter === 'hidden'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hidden
            </button>
          </div>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-600">No reviews match your current filter</p>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Rating */}
                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>

                    {/* Review Comment */}
                    <p className="text-gray-900 mb-4">{review.comment}</p>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Client</p>
                        <p className="font-medium text-gray-900">{review.client.name}</p>
                        <p className="text-gray-500 text-xs">{review.client.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Trainer</p>
                        <p className="font-medium text-gray-900">{review.trainer.name}</p>
                        <p className="text-gray-500 text-xs">{review.trainer.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Session Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(review.booking.session_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Posted On</p>
                        <p className="font-medium text-gray-900">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2 mt-4">
                      {review.is_verified && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Verified Purchase
                        </span>
                      )}
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          review.is_visible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {review.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col gap-2">
                    <Button
                      onClick={() => handleToggleVisibility(review.id, review.is_visible)}
                      variant="outline"
                      size="sm"
                      className={
                        review.is_visible
                          ? 'border-red-300 text-red-700 hover:bg-red-50'
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      }
                    >
                      {review.is_visible ? 'Hide' : 'Show'}
                    </Button>
                    {review.is_visible && (
                      <Button
                        onClick={() => handleMarkSpam(review.id)}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        Mark Spam
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <Card className="mt-6 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{' '}
              {Math.min(page * pageSize, totalCount)} of {totalCount} reviews
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <div className="flex items-center px-4">
                <span className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(totalCount / pageSize)}
                </span>
              </div>
              <Button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AdminReviews
