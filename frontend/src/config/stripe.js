/**
 * Stripe Configuration
 * Public key for client-side Stripe.js integration
 */

// Get Stripe publishable key from environment variable
// For development, you can hardcode it temporarily
// For production, use environment variables
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY_HERE'

// Note: Get your publishable key from:
// https://dashboard.stripe.com/test/apikeys (for test mode)
// https://dashboard.stripe.com/apikeys (for live mode)
