import { useState, useEffect } from 'react'
import { Card, Button } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes'
import BookingDetailModal from '../../components/admin/BookingDetailModal'

/**
 * Admin Bookings Management
 * View and manage all platform bookings
 */
const AdminBookings = () => {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)

  // Modal state
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Fetch bookings
  useEffect(() => {
    fetchBookings()
  }, [statusFilter, page, tokens])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const fetchBookings = async () => {
    try {
      if (!tokens?.access) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      // Add pagination parameters
      params.append('page', page.toString())
      params.append('page_size', pageSize.toString())

      const url = `http://localhost:8000/api/v1/admin/bookings/?${params.toString()}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.results)
      setTotalCount(data.count)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = (bookingId) => {
    setSelectedBookingId(bookingId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBookingId(null)
  }

  const handleBookingUpdated = () => {
    fetchBookings()
  }

  const handleExportCSV = () => {
    // Use fetch to download with authentication
    fetch('http://localhost:8000/api/v1/admin/export/bookings/', {
      headers: {
        'Authorization': `Bearer ${tokens.access}`,
      },
    })
      .then(response => response.blob())
      .then(blob => {
        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)
      })
      .catch(error => {
        console.error('Export failed:', error)
        alert('Failed to export bookings. Please try again.')
      })
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Bookings</h3>
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
              <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
              <p className="text-gray-600 mt-1">View and manage all platform bookings</p>
            </div>
            <div className="flex gap-3 items-center">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </Button>
              <button
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'confirmed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Booking ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Trainer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Session Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Duration
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Created
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        #{booking.id}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {booking.client_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {booking.trainer_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(booking.session_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {booking.start_time}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {booking.duration_minutes} min
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                        ${booking.total_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer with Pagination */}
          {bookings.length > 0 && (
            <>
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{' '}
                    {Math.min(page * pageSize, totalCount)} of {totalCount} bookings
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    Page Total Revenue:{' '}
                    <span className="text-primary-600">
                      $
                      {bookings
                        .reduce((sum, b) => sum + b.total_price, 0)
                        .toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalCount > pageSize && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
                  <div className="text-sm text-gray-600">
                    Page {page} of {Math.ceil(totalCount / pageSize)}
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
                    <Button
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={page >= Math.ceil(totalCount / pageSize)}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        bookingId={selectedBookingId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBookingUpdated={handleBookingUpdated}
        tokens={tokens}
      />
    </div>
  )
}

export default AdminBookings
