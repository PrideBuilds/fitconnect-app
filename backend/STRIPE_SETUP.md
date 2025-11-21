# Stripe Payment Integration Setup Guide

## Overview

FitConnect uses Stripe for secure payment processing. This guide will walk you through setting up Stripe for both development (test mode) and production (live mode).

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" to create an account
3. Complete the registration process
4. Verify your email address

## Step 2: Get Your API Keys (Test Mode for Development)

### Navigate to API Keys

1. Log in to your Stripe Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Click "Developers" in the top navigation
3. Click "API keys" in the sidebar
4. Make sure you're in "Test mode" (toggle in the top right)

### Copy Your Test Keys

You'll see two types of keys:

- **Publishable key** (starts with `pk_test_`)
  - Safe to expose in frontend code
  - Used to initialize Stripe.js in React

- **Secret key** (starts with `sk_test_`)
  - **NEVER** expose this key publicly
  - Used in backend Django code
  - Keep this in your `.env` file

### Update Your `.env` File

```bash
# In backend/.env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

**Important:** Replace `YOUR_SECRET_KEY_HERE` and `YOUR_PUBLISHABLE_KEY_HERE` with your actual Stripe test keys.

## Step 3: Set Up Webhook for Local Development

Stripe sends webhook events (payment succeeded, payment failed, etc.) to your server. For local development, you'll use Stripe CLI to forward webhooks to your localhost.

### Install Stripe CLI

**macOS (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

**Windows:**
Download from [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)

### Authenticate Stripe CLI

```bash
stripe login
```

This will open your browser to authorize the CLI.

### Forward Webhooks to Localhost

In a new terminal window, run:

```bash
stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef (^C to quit)
```

**Copy the webhook signing secret** (starts with `whsec_`) and add it to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Keep this terminal running** while developing. Stripe CLI will forward all webhook events to your local Django server.

## Step 4: Test Your Integration

### Test with Stripe Test Cards

Use these test card numbers (they won't charge real money):

**Successful payment:**
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Payment requires authentication (3D Secure):**
- Card number: `4000 0025 0000 3155`

**Payment declined:**
- Card number: `4000 0000 0000 9995`

**Insufficient funds:**
- Card number: `4000 0000 0000 9995`

Full list: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

### Test the Payment Flow

1. Start your Django server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Start your React frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Create a booking and proceed to payment
4. Use a test card number from above
5. Check your Stripe Dashboard → Payments to see the test payment

### Monitor Webhook Events

While the Stripe CLI is running (`stripe listen`), you'll see webhook events in real-time:

```
2025-11-15 20:00:01   --> payment_intent.created [evt_123...]
2025-11-15 20:00:05   --> payment_intent.succeeded [evt_456...]
```

These events trigger your webhook handler in `payments/views.py`.

## Step 5: Production Setup (When Ready to Go Live)

### Switch to Live Mode

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode" (top right)
2. Complete Stripe's onboarding requirements:
   - Business information
   - Bank account for payouts
   - Identity verification

### Get Live API Keys

1. Go to Developers → API keys (in Live mode)
2. Copy your **live** keys (start with `sk_live_` and `pk_live_`)
3. Update your production `.env` file:

```bash
# In production .env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

### Set Up Production Webhook

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your production URL:
   ```
   https://api.fitconnect.com/api/v1/payments/webhook/
   ```
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`

5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your production `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
   ```

## API Endpoints Reference

### Create Payment Intent

```
POST /api/v1/payments/create-payment-intent/
Authorization: Bearer <jwt_token>

Request Body:
{
  "booking_id": 123
}

Response:
{
  "client_secret": "pi_1234567890_secret_abcdefg",
  "payment_intent_id": "pi_1234567890",
  "payment_id": 456,
  "amount": "75.00",
  "currency": "usd"
}
```

### List Payments

```
GET /api/v1/payments/
Authorization: Bearer <jwt_token>

Response:
[
  {
    "id": 1,
    "booking_id": 123,
    "amount": "75.00",
    "status": "succeeded",
    "payment_method_type": "card",
    "card_brand": "visa",
    "card_last4": "4242",
    ...
  }
]
```

### Get Payment Details

```
GET /api/v1/payments/{id}/
Authorization: Bearer <jwt_token>

Response:
{
  "id": 1,
  "booking_id": 123,
  "amount": "75.00",
  "platform_fee_amount": "11.25",
  "trainer_payout_amount": "63.75",
  "status": "succeeded",
  ...
}
```

### Process Refund

```
POST /api/v1/payments/{id}/refund/
Authorization: Bearer <jwt_token>

Request Body:
{
  "amount": "75.00",  // Full or partial refund amount
  "reason": "Client requested cancellation"
}

Response:
{
  "message": "Refund processed successfully",
  "refund_id": "re_1234567890",
  "amount": "75.00",
  "payment": { ... }
}
```

## Platform Fees

FitConnect takes a **15% platform fee** from each booking payment:

- **Booking price:** $75.00
- **Platform fee (15%):** $11.25
- **Trainer payout:** $63.75

This is automatically calculated in the `Payment` model.

## Security Best Practices

1. **Never commit API keys to git**
   - Keys are in `.env` which is in `.gitignore`

2. **Use test mode for development**
   - Only use live keys in production

3. **Verify webhook signatures**
   - The webhook handler already does this with `STRIPE_WEBHOOK_SECRET`

4. **Use HTTPS in production**
   - Stripe requires HTTPS for webhooks

5. **Handle errors gracefully**
   - Show user-friendly messages
   - Log detailed errors for debugging

## Troubleshooting

### Webhook not receiving events

- Make sure `stripe listen` is running for local development
- Check that webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly

### Payment fails with "Invalid API Key"

- Check that `STRIPE_SECRET_KEY` is set in `.env`
- Verify you're using the correct key (test vs live)
- Restart Django server after updating `.env`

### Frontend can't connect to Stripe

- Make sure `STRIPE_PUBLISHABLE_KEY` is passed to frontend
- Verify you're using the publishable key, not secret key
- Check browser console for Stripe.js errors

### Refund fails

- Verify payment status is 'succeeded'
- Check refund amount doesn't exceed payment amount
- Ensure sufficient time has passed since original charge

## Testing Checklist

Before going to production, test:

- [ ] Create payment intent for booking
- [ ] Complete payment with test card
- [ ] Verify payment shows as succeeded in database
- [ ] Verify booking payment_status updates to 'paid'
- [ ] Webhook receives payment_intent.succeeded event
- [ ] Process full refund
- [ ] Process partial refund
- [ ] Test payment failure with declined card
- [ ] Test 3D Secure authentication flow
- [ ] Verify payment receipt email sent

## Helpful Resources

- **Stripe Documentation:** [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Dashboard:** [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **Test Cards:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Reference:** [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Stripe CLI:** [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

## Support

If you encounter issues:

1. Check Stripe Dashboard → Logs for payment errors
2. Check Django server logs for webhook/API errors
3. Review Stripe CLI output for webhook events
4. Contact Stripe Support: [https://support.stripe.com](https://support.stripe.com)
