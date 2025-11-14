import { useState, useEffect } from 'react'
import { Card, Input, Button } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes'

/**
 * Admin Users Management
 * List, search, and manage platform users
 */
const AdminUsers = () => {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [roleFilter, tokens])

  const fetchUsers = async () => {
    try {
      if (!tokens?.access) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      let url = 'http://localhost:8000/api/v1/admin/users/'
      const params = new URLSearchParams()

      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'trainer':
        return 'bg-blue-100 text-blue-800'
      case 'client':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage platform users and permissions</p>
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
        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Role Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter('client')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === 'client'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setRoleFilter('trainer')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === 'trainer'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trainers
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  roleFilter === 'admin'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins
              </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Joined</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {u.first_name && u.last_name
                              ? `${u.first_name} ${u.last_name}`
                              : u.username}
                          </div>
                          <div className="text-sm text-gray-500">@{u.username}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {u.is_active ? (
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          ) : (
                            <span className="text-xs text-red-600 font-medium">Inactive</span>
                          )}
                          {u.email_verified ? (
                            <span className="text-xs text-gray-500">Verified</span>
                          ) : (
                            <span className="text-xs text-amber-600">Unverified</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminUsers
