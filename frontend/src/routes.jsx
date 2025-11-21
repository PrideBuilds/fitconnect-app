/**
 * Route constants for the application
 * Centralized route definitions to avoid hardcoding URLs
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email/:token',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',

  // Client routes
  CLIENT_DASHBOARD: '/client/dashboard',
  CLIENT_PROFILE: '/client/profile',
  CLIENT_BOOKINGS: '/client/bookings',
  SEARCH_TRAINERS: '/search',
  TRAINER_DETAIL: '/trainers/:id',

  // Payment routes
  BOOKING_PAYMENT: '/payment/:bookingId',
  PAYMENT_CONFIRMATION: '/payment/confirmation',

  // Trainer routes
  TRAINER_DASHBOARD: '/trainer/dashboard',
  TRAINER_PROFILE: '/trainer/profile',
  TRAINER_PROFILE_CREATE: '/trainer/profile/create',
  TRAINER_BOOKINGS: '/trainer/bookings',
  TRAINER_AVAILABILITY: '/trainer/availability',

  // Shared routes
  PROFILE_SETTINGS: '/settings',
  HELP: '/help',
  ABOUT: '/about',
  CHAT: '/chat',

  // Additional pages
  HOW_IT_WORKS: '/how-it-works',
  FOR_TRAINERS: '/for-trainers',
  REVIEWS: '/reviews',
  PRICING: '/pricing',
  TRAINER_RESOURCES: '/trainer-resources',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',

  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_TRAINERS: '/admin/trainers',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_REVIEWS: '/admin/reviews',
}

/**
 * Helper function to generate trainer detail URL
 * @param {string} id - Trainer ID
 * @returns {string} URL path
 */
export const getTrainerDetailPath = (id) => `/trainers/${id}`
