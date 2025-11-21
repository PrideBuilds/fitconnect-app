import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Card, Button } from '../../components/ui'
import { ROUTES } from '../../routes'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Payment Confirmation Page
 * Shows success message and booking details after payment
 */
const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tokens } = useAuth()

  const [payment, setPayment] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const paymentIntentId = searchParams.get('payment_intent')
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (!tokens?.access) {
          setError('Please log in to view payment details')
          setLoading(false)
          return
        }

        const token = tokens.access

        // If we have payment_intent from Stripe redirect
        if (!paymentIntentId && !paymentIntentClientSecret) {
          setError('No payment information found')
          return
        }

        // Fetch payment list and find this payment by Stripe payment intent ID
        const response = await fetch('http://localhost:8000/api/v1/payments/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load payment details')
        }

        const payments = await response.json()
        const currentPayment = payments.find(
          (p) => p.stripe_payment_intent_id === paymentIntentId
        )

        if (!currentPayment) {
          setError('Payment not found')
          return
        }

        setPayment(currentPayment)

        // Fetch booking details
        const bookingResponse = await fetch(
          `http://localhost:8000/api/v1/bookings/${currentPayment.booking_id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json()
          setBooking(bookingData)
        }
      } catch (err) {
        console.error('Error fetching payment details:', err)
        setError(err.message || 'Failed to load payment details')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [paymentIntentId, paymentIntentClientSecret, tokens])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <Card className="p-8 text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your training session has been confirmed and paid for.
          </p>

          {payment && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Payment ID</p>
              <p className="font-mono text-sm font-medium text-gray-900">#{payment.id}</p>
            </div>
          )}
        </Card>

        {/* Payment Details */}
        {payment && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-semibold text-gray-900">${payment.amount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900 capitalize">
                  {payment.payment_method_type === 'card'
                    ? `${payment.card_brand} •••• ${payment.card_last4}`
                    : payment.payment_method_type}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {payment.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium text-gray-900">
                  {new Date(payment.created_at).toLocaleString()}
                </span>
              </div>

              {payment.receipt_url && (
                <div className="pt-3 border-t border-gray-200">
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Booking Details */}
        {booking && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Details</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Trainer</p>
                <p className="font-medium text-gray-900">{booking.trainer_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.session_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {' at '}
                  {booking.start_time}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{booking.duration_minutes} minutes</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{booking.location_address}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>You'll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Your trainer has been notified of the booking</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>You can view your session details in your bookings</span>
            </li>
          </ul>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={ROUTES.CLIENT_BOOKINGS} className="flex-1">
            <Button variant="outline" className="w-full">
              View My Bookings
            </Button>
          </Link>
          <Link to={ROUTES.SEARCH_TRAINERS} className="flex-1">
            <Button className="w-full">Book Another Session</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentConfirmation
