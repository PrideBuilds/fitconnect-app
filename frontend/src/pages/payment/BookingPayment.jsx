import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import CheckoutForm from '../../components/payment/CheckoutForm'
import { Card, Button } from '../../components/ui'
import { ROUTES } from '../../routes'
import { STRIPE_PUBLISHABLE_KEY } from '../../config/stripe'
import { useAuth } from '../../contexts/AuthContext'

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

/**
 * Booking Payment Page
 * Creates payment intent and handles Stripe checkout
 */
const BookingPayment = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { tokens } = useAuth()

  const [booking, setBooking] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentId, setPaymentId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Memoize Stripe options - only create when we have a valid clientSecret
  const options = useMemo(() => {
    if (!clientSecret) {
      console.log('No clientSecret yet')
      return null
    }

    console.log('Creating Stripe options with clientSecret:', clientSecret)
    return {
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3b82f6',
        },
      },
    }
  }, [clientSecret])

  useEffect(() => {
    const fetchBookingAndCreatePaymentIntent = async () => {
      try {
        if (!tokens?.access) {
          setError('Please log in to continue')
          setLoading(false)
          return
        }

        const token = tokens.access

        // 1. Fetch booking details
        const bookingResponse = await fetch(
          `http://localhost:8000/api/v1/bookings/${bookingId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!bookingResponse.ok) {
          throw new Error('Failed to load booking details')
        }

        const bookingData = await bookingResponse.json()
        setBooking(bookingData)

        // Check if already paid
        if (bookingData.payment_status === 'paid') {
          setError('This booking has already been paid for')
          return
        }

        // 2. Create payment intent
        const paymentResponse = await fetch(
          'http://localhost:8000/api/v1/payments/create-payment-intent/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              booking_id: parseInt(bookingId),
            }),
          }
        )

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json()
          throw new Error(errorData.error || 'Failed to initialize payment')
        }

        const paymentData = await paymentResponse.json()
        console.log('Payment Intent Response:', paymentData)
        console.log('Client Secret:', paymentData.client_secret)
        setClientSecret(paymentData.client_secret)
        setPaymentId(paymentData.payment_id)
      } catch (err) {
        console.error('Payment initialization error:', err)
        setError(err.message || 'Failed to initialize payment')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingAndCreatePaymentIntent()
  }, [bookingId, tokens])

  const handlePaymentSuccess = async (paymentIntent) => {
    // Confirm payment status on backend (updates booking payment_status)
    try {
      await fetch('http://localhost:8000/api/v1/payments/confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.access}`,
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id,
        }),
      })
    } catch (err) {
      console.error('Error confirming payment:', err)
      // Continue to confirmation page even if confirmation fails
    }

    // Navigate to confirmation page
    navigate(`/payment/confirmation?payment_intent=${paymentIntent.id}`)
  }

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error)
    setError(error.message || 'Payment failed. Please try again.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your checkout...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to={ROUTES.CLIENT_BOOKINGS}>
              <Button variant="outline" className="w-full">
                Back to Bookings
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  if (!clientSecret || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-600">Unable to load payment details</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Booking ID: #{booking.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {options && (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm
                    amount={parseFloat(booking.total_price)}
                    bookingId={parseInt(bookingId)}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              )}
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Trainer</p>
                  <p className="font-medium text-gray-900">{booking.trainer_name}</p>
                </div>

                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(booking.session_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">
                    {booking.start_time} - {booking.end_time}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{booking.duration_minutes} minutes</p>
                </div>

                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{booking.location_address}</p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-gray-500">Rate</p>
                  <p className="font-medium text-gray-900">${booking.hourly_rate}/hour</p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ${booking.total_price}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cancellation Policy */}
            <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Cancellation Policy
              </h4>
              <p className="text-xs text-blue-800">
                Free cancellation up to 24 hours before the session. Cancellations within 24 hours
                may incur a fee.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPayment
