import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../routes'
import { useState } from 'react'
import { Button, Badge } from './ui'

/**
 * Header component with responsive navigation
 * Shows different navigation items based on authentication and user role
 */
const Header = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Navigation items for authenticated users based on role
  const getAuthenticatedNavItems = () => {
    if (!user) return []

    const commonItems = [
      { label: 'Profile Settings', path: ROUTES.PROFILE_SETTINGS },
    ]

    if (user.role === 'client') {
      return [
        { label: 'Dashboard', path: ROUTES.CLIENT_DASHBOARD },
        { label: 'Search Trainers', path: ROUTES.SEARCH_TRAINERS },
        { label: 'My Bookings', path: ROUTES.CLIENT_BOOKINGS },
        ...commonItems,
      ]
    }

    if (user.role === 'trainer') {
      return [
        { label: 'Dashboard', path: ROUTES.TRAINER_DASHBOARD },
        { label: 'My Profile', path: ROUTES.TRAINER_PROFILE },
        { label: 'Bookings', path: ROUTES.TRAINER_BOOKINGS },
        { label: 'Availability', path: ROUTES.TRAINER_AVAILABILITY },
        ...commonItems,
      ]
    }

    if (user.role === 'admin') {
      return [
        { label: 'Admin Dashboard', path: ROUTES.ADMIN_DASHBOARD },
        { label: 'Manage Users', path: ROUTES.ADMIN_USERS },
        { label: 'Approve Trainers', path: ROUTES.ADMIN_TRAINERS },
        { label: 'View Bookings', path: ROUTES.ADMIN_BOOKINGS },
        ...commonItems,
      ]
    }

    return commonItems
  }

  // Public navigation items
  const publicNavItems = [
    { label: 'Find Trainers', path: ROUTES.SEARCH_TRAINERS },
    { label: 'About', path: ROUTES.ABOUT },
    { label: 'Help', path: ROUTES.HELP },
  ]

  const navItems = isAuthenticated ? getAuthenticatedNavItems() : publicNavItems

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FitConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 font-medium">{user.username}</span>
                  <Badge
                    variant={user.role === 'admin' ? 'danger' : user.role === 'trainer' ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {user.role}
                  </Badge>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <Button to={ROUTES.LOGIN} variant="ghost" size="sm">
                  Login
                </Button>
                <Button to={ROUTES.REGISTER} size="sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-600 hover:text-gray-900 p-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4 animate-fade-in">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-all py-3 px-3 rounded-lg font-medium"
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <div className="flex items-center space-x-2 px-3 pb-3">
                    <span className="text-gray-700 font-medium">{user.username}</span>
                    <Badge
                      variant={user.role === 'admin' ? 'danger' : user.role === 'trainer' ? 'primary' : 'secondary'}
                      size="sm"
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    fullWidth
                    className="justify-start"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100 mt-4">
                  <Button
                    to={ROUTES.LOGIN}
                    variant="ghost"
                    fullWidth
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Button>
                  <Button
                    to={ROUTES.REGISTER}
                    fullWidth
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
