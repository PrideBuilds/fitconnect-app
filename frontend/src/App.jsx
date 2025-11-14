import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { ROUTES } from './routes'

// Page imports
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import About from './pages/About'
import Help from './pages/Help'
import ProfileSettings from './pages/ProfileSettings'
import SearchTrainers from './pages/SearchTrainers'
import TrainerDetail from './pages/TrainerDetail'

// Client pages
import ClientDashboard from './pages/client/ClientDashboard'
import ClientProfile from './pages/client/ClientProfile'
import ClientBookings from './pages/client/ClientBookings'

// Trainer pages
import TrainerDashboard from './pages/trainer/TrainerDashboard'
import TrainerProfile from './pages/trainer/TrainerProfile'
import TrainerBookings from './pages/trainer/TrainerBookings'
import TrainerAvailability from './pages/trainer/TrainerAvailability'

// Trainer components
import ProfileWizard from './components/profile/ProfileWizard'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTrainers from './pages/admin/AdminTrainers'
import AdminBookings from './pages/admin/AdminBookings'

/**
 * Main App Component
 * Sets up routing and authentication context
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.ABOUT} element={<About />} />
            <Route path={ROUTES.HELP} element={<Help />} />
            <Route path={ROUTES.SEARCH_TRAINERS} element={<SearchTrainers />} />
            <Route path={ROUTES.TRAINER_DETAIL} element={<TrainerDetail />} />

            {/* Protected Routes - Client Only */}
            <Route
              path={ROUTES.CLIENT_DASHBOARD}
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CLIENT_PROFILE}
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CLIENT_BOOKINGS}
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientBookings />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Trainer Only */}
            <Route
              path={ROUTES.TRAINER_DASHBOARD}
              element={
                <ProtectedRoute requiredRole="trainer">
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TRAINER_PROFILE}
              element={
                <ProtectedRoute requiredRole="trainer">
                  <TrainerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TRAINER_PROFILE_CREATE}
              element={
                <ProtectedRoute requiredRole="trainer">
                  <ProfileWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TRAINER_BOOKINGS}
              element={
                <ProtectedRoute requiredRole="trainer">
                  <TrainerBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TRAINER_AVAILABILITY}
              element={
                <ProtectedRoute requiredRole="trainer">
                  <TrainerAvailability />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Any Authenticated User */}
            <Route
              path={ROUTES.PROFILE_SETTINGS}
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Admin Only */}
            <Route
              path={ROUTES.ADMIN_DASHBOARD}
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN_USERS}
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN_TRAINERS}
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTrainers />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ADMIN_BOOKINGS}
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminBookings />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found - Could add a NotFound component later */}
            <Route
              path="*"
              element={
                <div className="container mx-auto px-4 py-12 text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                  <a href={ROUTES.HOME} className="text-blue-600 hover:text-blue-700 font-medium">
                    Go back home
                  </a>
                </div>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  )
}

export default App
