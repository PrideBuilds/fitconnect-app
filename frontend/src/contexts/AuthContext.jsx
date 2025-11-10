import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const AuthContext = createContext(null)

/**
 * Authentication Provider Component
 * Manages user authentication state and provides auth methods to the app
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState(() => {
    // Initialize tokens from localStorage
    const savedTokens = localStorage.getItem('tokens')
    return savedTokens ? JSON.parse(savedTokens) : null
  })

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      if (tokens?.access) {
        try {
          // Fetch current user data using access token
          const response = await fetch('http://localhost:8000/api/v1/users/me/', {
            headers: {
              'Authorization': `Bearer ${tokens.access}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            // Token invalid, clear auth
            logout()
          }
        } catch (error) {
          console.error('Failed to fetch user:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, []) // Only run on mount

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()

      // Save tokens to state and localStorage
      setTokens(data.tokens)
      localStorage.setItem('tokens', JSON.stringify(data.tokens))

      // Set user data
      setUser(data.user)

      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} User data
   */
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        // Handle Django validation errors (field-specific errors)
        if (typeof error === 'object' && !error.error) {
          // Format field errors into a readable message
          const errorMessages = Object.entries(error)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          throw new Error(errorMessages)
        }
        throw new Error(error.error || 'Registration failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Logout user and clear authentication data
   */
  const logout = () => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem('tokens')
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<string>} New access token
   */
  const refreshAccessToken = async () => {
    try {
      if (!tokens?.refresh) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('http://localhost:8000/api/v1/users/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const newTokens = {
        ...tokens,
        access: data.access,
      }

      setTokens(newTokens)
      localStorage.setItem('tokens', JSON.stringify(newTokens))

      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      throw error
    }
  }

  /**
   * Update user data in state
   * @param {Object} userData - Updated user data
   */
  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    tokens,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAccessToken,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
