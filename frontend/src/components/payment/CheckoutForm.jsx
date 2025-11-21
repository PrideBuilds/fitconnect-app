import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '../ui'
import PropTypes from 'prop-types'

/**
 * Stripe Checkout Form Component
 * Handles payment collection using Stripe Payment Element
 */
const CheckoutForm = ({ amount, onSuccess, onError, bookingId }) => {
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return
    }

    if (!isPaymentElementReady) {
      // PaymentElement isn't ready yet
      setErrorMessage('Please wait for the payment form to finish loading.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/confirmation`,
        },
        redirect: 'if_required', // Only redirect if 3D Secure is required
      })

      if (error) {
        // Payment failed
        setErrorMessage(error.message)
        if (onError) {
          onError(error)
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        if (onSuccess) {
          onSuccess(paymentIntent)
        }
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.')
      console.error('Payment error:', err)
      if (onError) {
        onError(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element - Stripe's all-in-one payment UI */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Details
        </h3>
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
          onReady={() => setIsPaymentElementReady(true)}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center text-red-800">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Amount Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span className="text-gray-700">Total Amount:</span>
          <span className="text-primary-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || !isPaymentElementReady || loading}
        loading={loading}
      >
        {loading ? 'Processing...' : !isPaymentElementReady ? 'Loading...' : `Pay $${amount.toFixed(2)}`}
      </Button>

      {/* Security Note */}
      <div className="text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Secured by Stripe - Your payment information is encrypted
        </p>
      </div>
    </form>
  )
}

CheckoutForm.propTypes = {
  amount: PropTypes.number.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  bookingId: PropTypes.number.isRequired,
}

export default CheckoutForm
