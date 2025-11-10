import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../routes'

/**
 * ProtectedRoute component
 * Wraps routes that require authentication and optionally a specific role
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} [props.requiredRole] - Required user role (client, trainer, admin)
 * @param {string} [props.redirectTo] - Where to redirect if unauthorized (default: /login)
 */
const ProtectedRoute = ({ children, requiredRole, redirectTo = ROUTES.LOGIN }) => {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's role
    const dashboardMap = {
      client: ROUTES.CLIENT_DASHBOARD,
      trainer: ROUTES.TRAINER_DASHBOARD,
      admin: '/admin/dashboard', // Admin route (not in ROUTES yet)
    }

    const userDashboard = dashboardMap[user.role] || ROUTES.HOME
    return <Navigate to={userDashboard} replace />
  }

  // User is authenticated and has correct role
  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(['client', 'trainer', 'admin']),
  redirectTo: PropTypes.string,
}

export default ProtectedRoute
