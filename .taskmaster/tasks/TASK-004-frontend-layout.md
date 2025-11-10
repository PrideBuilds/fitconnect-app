# TASK-004: Basic Frontend Layout and Navigation

**Epic:** Phase 1 - Sprint 1 (Week 1) - Foundation
**Complexity:** Medium (6 hours)
**Dependencies:** TASK-001 (Project setup), TASK-002 (Authentication)
**Assignee:** Frontend Developer
**Status:** Pending

---

## Overview

Build the foundational React frontend architecture with routing, authentication context, protected routes, navigation header/footer, and responsive layout using Tailwind CSS. Set up the structure for all future pages.

---

## Sub-Tasks

- [ ] 1. Set up React Router with route structure
  - Configure routes for public and protected pages
  - Create route constants
  - Set up 404 page

- [ ] 2. Create Authentication Context
  - Store user data and tokens
  - Login/logout functions
  - Token refresh logic
  - Persist auth state to localStorage

- [ ] 3. Create Protected Route component
  - Redirect to login if not authenticated
  - Role-based route protection
  - Loading state while checking auth

- [ ] 4. Build Navigation Header component
  - Logo and site name
  - Navigation links (dynamic based on auth state)
  - User menu dropdown
  - Mobile responsive hamburger menu

- [ ] 5. Build Footer component
  - Links (About, Contact, Terms, Privacy)
  - Copyright notice
  - Responsive layout

- [ ] 6. Create main Layout component
  - Header + Content + Footer structure
  - Responsive container
  - Consistent spacing

- [ ] 7. Create placeholder page components
  - Home page
  - Login page
  - Register page
  - Dashboard pages (Client, Trainer)
  - Search page

- [ ] 8. Style with Tailwind CSS
  - Consistent color scheme
  - Typography system
  - Responsive breakpoints
  - Dark mode support (optional)

---

## Implementation Guide

### Step 1: Set up React Router

**Install React Router:**
```bash
cd frontend
npm install react-router-dom
```

**File: `frontend/src/routes.jsx`** (create new file):
```jsx
// Route constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email/:token',
  RESET_PASSWORD: '/reset-password/:token',

  // Client routes
  CLIENT_DASHBOARD: '/dashboard/client',
  SEARCH: '/search',
  TRAINER_PROFILE: '/trainers/:id',
  BOOKING: '/booking/:trainerId',
  MY_BOOKINGS: '/bookings',

  // Trainer routes
  TRAINER_DASHBOARD: '/dashboard/trainer',
  TRAINER_PROFILE_EDIT: '/dashboard/trainer/profile',
  TRAINER_AVAILABILITY: '/dashboard/trainer/availability',
  TRAINER_BOOKINGS: '/dashboard/trainer/bookings',

  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',

  // Other
  NOT_FOUND: '/404',
};

export default ROUTES;
```

### Step 2: Create Authentication Context

**File: `frontend/src/contexts/AuthContext.jsx`** (create new directory and file):
```jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState({
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  });

  // Configure axios defaults
  useEffect(() => {
    if (tokens.access) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [tokens.access]);

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      if (tokens.access) {
        try {
          const response = await axios.get('/api/v1/users/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token might be expired, try refresh
          if (tokens.refresh) {
            await refreshAccessToken();
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/v1/users/login/', {
        email,
        password,
      });

      const { user: userData, tokens: userTokens } = response.data;

      // Save tokens
      localStorage.setItem('accessToken', userTokens.access);
      localStorage.setItem('refreshToken', userTokens.refresh);
      setTokens(userTokens);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/v1/users/register/', userData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setTokens({ access: null, refresh: null });
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshAccessToken = async () => {
    try {
      const response = await axios.post('/api/v1/users/token/refresh/', {
        refresh: tokens.refresh,
      });

      const newAccessToken = response.data.access;
      localStorage.setItem('accessToken', newAccessToken);
      setTokens(prev => ({ ...prev, access: newAccessToken }));

      // Retry loading user
      const userResponse = await axios.get('/api/v1/users/me/');
      setUser(userResponse.data);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const value = {
    user,
    tokens,
    loading,
    login,
    register,
    logout,
    refreshAccessToken,
    isAuthenticated: !!user,
    isClient: user?.role === 'client',
    isTrainer: user?.role === 'trainer',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
```

### Step 3: Create Protected Route Component

**File: `frontend/src/components/ProtectedRoute.jsx`** (create components directory):
```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ROUTES from '../routes';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectMap = {
      client: ROUTES.CLIENT_DASHBOARD,
      trainer: ROUTES.TRAINER_DASHBOARD,
      admin: ROUTES.ADMIN_DASHBOARD,
    };
    return <Navigate to={redirectMap[user.role] || ROUTES.HOME} replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Step 4: Build Navigation Header

**File: `frontend/src/components/Header.jsx`**:
```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ROUTES from '../routes';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const getDashboardLink = () => {
    if (!user) return ROUTES.HOME;
    const dashboardMap = {
      client: ROUTES.CLIENT_DASHBOARD,
      trainer: ROUTES.TRAINER_DASHBOARD,
      admin: ROUTES.ADMIN_DASHBOARD,
    };
    return dashboardMap[user.role] || ROUTES.HOME;
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">FitConnect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.SEARCH}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Find Trainers
                </Link>
                <Link
                  to={getDashboardLink()}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Dashboard
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-semibold text-gray-900">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.SEARCH}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Find Trainers
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
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
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.SEARCH}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Find Trainers
                </Link>
                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.SEARCH}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Find Trainers
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
```

### Step 5: Build Footer Component

**File: `frontend/src/components/Footer.jsx`**:
```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">FitConnect</h3>
            <p className="text-sm">
              Connecting travelers with personal trainers and gyms worldwide.
              Maintain your fitness routine wherever you go.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search" className="hover:text-white transition">
                  Find Trainers
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-white transition">
                  Safety Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* For Trainers */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Trainers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/become-trainer" className="hover:text-white transition">
                  Become a Trainer
                </Link>
              </li>
              <li>
                <Link to="/trainer-resources" className="hover:text-white transition">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/verification" className="hover:text-white transition">
                  Verification Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} FitConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

### Step 6: Create Layout Component

**File: `frontend/src/components/Layout.jsx`**:
```jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
```

### Step 7: Create Placeholder Pages

**File: `frontend/src/pages/Home.jsx`** (create pages directory):
```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ROUTES from '../routes';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Find Personal Trainers Anywhere You Travel
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Like Airbnb for fitness. Book qualified trainers in any city.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to={ROUTES.SEARCH}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Find Trainers
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition border-2 border-white"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            How FitConnect Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Search</h3>
              <p className="text-gray-600">
                Find trainers near your hotel or destination
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Book</h3>
              <p className="text-gray-600">
                Choose a time slot and book your session
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💪</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Train</h3>
              <p className="text-gray-600">
                Meet your trainer and crush your workout
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
```

**File: `frontend/src/pages/NotFound.jsx`**:
```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ROUTES from '../routes';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link
          to={ROUTES.HOME}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
```

**File: `frontend/src/pages/Login.jsx`**:
```jsx
import React from 'react';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <p className="text-gray-600">Login form will be implemented in Sprint 2</p>
      </div>
    </div>
  );
};

export default Login;
```

**Create similar placeholder files for**: `Register.jsx`, `ClientDashboard.jsx`, `TrainerDashboard.jsx`, `Search.jsx`

### Step 8: Update Main App Component

**File: `frontend/src/App.jsx`**:
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ROUTES from './routes';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import Search from './pages/Search';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.SEARCH} element={<Search />} />

            {/* Protected routes - Client */}
            <Route
              path={ROUTES.CLIENT_DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Trainer */}
            <Route
              path={ROUTES.TRAINER_DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

---

## Acceptance Criteria

- [x] React Router configured with all routes
- [x] Authentication context provides user state globally
- [x] Protected routes redirect to login if not authenticated
- [x] Role-based routing prevents unauthorized access
- [x] Navigation header displays appropriate links based on auth state
- [x] Header is mobile responsive with hamburger menu
- [x] Footer contains company links
- [x] Layout component wraps all pages consistently
- [x] Home page displays hero section and features
- [x] All routes render without errors

---

## Test Cases

### Test 1: Navigation Works
```bash
# Start frontend
cd frontend
npm run dev

# Visit http://localhost:3000
# Click "Find Trainers" → should navigate to /search
# Click "Login" → should navigate to /login
# Click logo → should return to home
```

### Test 2: Protected Routes Redirect
```bash
# Without logging in, visit:
http://localhost:3000/dashboard/client

# Expected: Redirect to /login
```

### Test 3: Mobile Responsive
```bash
# Open http://localhost:3000
# Open DevTools (Cmd+Option+I)
# Toggle device toolbar (Cmd+Shift+M)
# Select iPhone SE

# Expected:
# - Hamburger menu appears
# - Clicking hamburger shows mobile menu
# - All links work in mobile view
```

### Test 4: Authentication Context
```javascript
// In browser console (http://localhost:3000)
localStorage.setItem('accessToken', 'fake_token');
localStorage.setItem('refreshToken', 'fake_refresh');

// Reload page
// Expected: AuthContext tries to load user with token
```

---

## Next Steps

After completing TASK-004:
1. Implement full Login/Register forms (Sprint 2)
2. Build dashboard pages (Sprint 2-3)
3. Test full authentication flow (register → verify → login → dashboard)
4. Proceed to **TASK-005**: Trainer profile models

---

**Estimated Time**: 6 hours
**Last Updated**: 2025-11-06
