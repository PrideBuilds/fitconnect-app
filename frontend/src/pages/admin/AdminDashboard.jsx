import { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes'

/**
 * Admin Dashboard
 * Platform overview and statistics for admins
 */
const AdminDashboard = () => {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!tokens?.access) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const response = await fetch('http://localhost:8000/api/v1/admin/stats/', {
          headers: {
            'Authorization': `Bearer ${tokens.access}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [tokens])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and management</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users.total}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.users.new_this_month} new this month
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-gray-600">Clients: <strong>{stats.users.clients}</strong></span>
              <span className="text-gray-600">Trainers: <strong>{stats.users.trainers}</strong></span>
            </div>
          </Card>

          {/* Total Trainers */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trainer Profiles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.trainers.published}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.trainers.pending} pending approval
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Verified: <strong>{stats.trainers.verified}</strong>
            </div>
          </Card>

          {/* Total Bookings */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.bookings.total}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.bookings.pending} pending
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-gray-600">Confirmed: <strong>{stats.bookings.confirmed}</strong></span>
              <span className="text-gray-600">Completed: <strong>{stats.bookings.completed}</strong></span>
            </div>
          </Card>

          {/* Total Revenue */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.revenue.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ${stats.revenue.this_month.toFixed(2)} this month
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Avg per booking: <strong>${stats.revenue.average_booking.toFixed(2)}</strong>
            </div>
          </Card>
        </div>

        {/* Top Trainers */}
        {stats.top_trainers && stats.top_trainers.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Trainers by Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Trainer</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Bookings</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_trainers.map((trainer, index) => (
                    <tr key={trainer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {index + 1}. {trainer.name || 'Unnamed Trainer'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {trainer.bookings}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {trainer.rating > 0 ? trainer.rating.toFixed(2) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 mb-1">Manage Users</div>
              <div className="text-sm text-gray-600">View and manage all users</div>
              <div className="text-xs text-primary-600 mt-2 font-medium">View Users →</div>
            </button>
            <button
              onClick={() => navigate(ROUTES.ADMIN_TRAINERS)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 mb-1">Approve Trainers</div>
              <div className="text-sm text-gray-600">{stats.trainers.pending} pending approval</div>
              <div className="text-xs text-primary-600 mt-2 font-medium">Review Trainers →</div>
            </button>
            <button
              onClick={() => navigate(ROUTES.ADMIN_BOOKINGS)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 mb-1">View All Bookings</div>
              <div className="text-sm text-gray-600">Booking oversight and management</div>
              <div className="text-xs text-primary-600 mt-2 font-medium">View Bookings →</div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
