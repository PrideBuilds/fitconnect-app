# Stripe Webhook Setup - Quick Reference

## Overview

Stripe webhooks notify your application about payment events (successful payments, failures, refunds). This guide provides quick setup instructions for both development and production.

## Development Setup (Local Testing)

### Prerequisites
- Stripe CLI installed: `brew install stripe/stripe-cli/stripe`
- Stripe CLI authenticated: `stripe login`
- Backend server running: `python manage.py runserver`

### Step 1: Get Your Webhook Secret

Run this command to start the webhook listener and get your secret:

```bash
stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/ --print-secret
```

Copy the secret that starts with `whsec_` and add it to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 2: Keep the Listener Running

In a separate terminal window, run:

```bash
stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/
```

Keep this running while testing payments. You'll see webhook events in real-time:

```
2025-11-20 23:00:01   --> payment_intent.created [evt_123...]
2025-11-20 23:00:05   --> payment_intent.succeeded [evt_456...]
```

### Step 3: Restart Django Server

After updating `.env`, restart your Django server to load the new webhook secret:

```bash
# Stop the server (Ctrl+C) and restart
python manage.py runserver
```

## Testing Webhook Events

### Trigger Test Payments

1. Create a booking in the app
2. Go to payment page
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Watch webhook events in the `stripe listen` terminal

### Webhook Events to Watch For

The following events are handled by FitConnect:

- **`payment_intent.succeeded`** - Payment completed successfully
  - Updates payment status to 'succeeded'
  - Marks booking as 'paid'
  - Sends payment confirmation email

- **`payment_intent.payment_failed`** - Payment failed
  - Updates payment status to 'failed'
  - Records failure reason
  - Sends payment failure email

- **`payment_intent.canceled`** - Payment canceled
  - Updates payment status to 'canceled'

- **`charge.refunded`** - Refund processed
  - Logs refund for confirmation

### Testing Email Notifications

With webhooks configured, test that emails are sent:

```bash
# Set email backend to console to see emails in terminal
# In .env:
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Or use SMTP to send real emails:
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
```

Check Django server output for email content.

## Production Setup

### Step 1: Create Webhook Endpoint in Stripe Dashboard

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live mode** (toggle in top right)
3. Navigate to: **Developers → Webhooks**
4. Click **"Add endpoint"**
5. Enter your production URL:
   ```
   https://yourdomain.com/api/v1/payments/webhook/
   ```
6. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`

7. Click **"Add endpoint"**

### Step 2: Get Production Webhook Secret

1. Click on your newly created webhook endpoint
2. Click **"Signing secret"** in the right panel
3. Click **"Reveal"** to see the secret (starts with `whsec_`)
4. Copy the secret

### Step 3: Update Production Environment

Add the production webhook secret to your production `.env` or environment variables:

```bash
# Production .env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

### Step 4: Verify Webhook Setup

1. Deploy your application with the new webhook secret
2. Restart your application server
3. In Stripe Dashboard, go to **Webhooks** and click your endpoint
4. Click **"Send test webhook"**
5. Select `payment_intent.succeeded` and click **"Send test webhook"**
6. Verify the webhook is received (status 200)

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: Is Stripe CLI running?** (Development only)
```bash
# Should show webhook listener running
ps aux | grep "stripe listen"
```

**Check 2: Is webhook secret set?**
```bash
# In backend directory
grep STRIPE_WEBHOOK_SECRET .env
```

**Check 3: Is Django server running?**
```bash
curl http://localhost:8000/api/v1/payments/webhook/
# Should return 405 Method Not Allowed (POST required)
```

**Check 4: Check Django logs**
```bash
# Look for webhook errors
tail -f logs/django.log  # If logging to file
# Or check terminal where Django server is running
```

### Webhook Signature Verification Failed

**Error**: `Invalid webhook signature`

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe CLI or Dashboard
2. Restart Django server after changing `.env`
3. For production, ensure you're using the **production** webhook secret, not development

### Payment Succeeds but Webhook Not Triggered

**Development**: Make sure `stripe listen` is running in a separate terminal

**Production**:
1. Check Stripe Dashboard → Webhooks → your endpoint → **Logs**
2. Look for failed webhook delivery attempts
3. Verify your production URL is correct and publicly accessible
4. Ensure your server accepts POST requests to `/api/v1/payments/webhook/`

### CSRF Token Error

The webhook endpoint is decorated with `@csrf_exempt` in `payments/views.py` to allow Stripe's POST requests. If you see CSRF errors:

1. Verify the endpoint has `@csrf_exempt` decorator
2. Check Django middleware configuration

## Development Workflow

### Daily Development Checklist

Before testing payments each day:

1. ✅ Start Django server: `python manage.py runserver`
2. ✅ Start frontend: `npm run dev`
3. ✅ Start Stripe listener: `stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/`
4. ✅ Verify webhook secret in `.env`

### Stopping Work

You can safely stop the `stripe listen` process when not testing payments. The webhook secret remains valid until you re-authenticate Stripe CLI (every 90 days).

## Webhook Secret Expiration

### Development
The webhook secret from `stripe listen` remains valid as long as Stripe CLI is authenticated.

**Re-authenticate when**:
- You see "Expired authentication" error
- CLI prompts for re-authentication (every 90 days)

**To re-authenticate**:
```bash
stripe login
```

The webhook secret will stay the same after re-authentication.

### Production
Production webhook secrets **do not expire**. They remain valid until you manually rotate them in the Stripe Dashboard.

**To rotate production secret**:
1. Stripe Dashboard → Developers → Webhooks
2. Click your endpoint
3. Click **"Roll secret"**
4. Update your production environment with the new secret
5. Deploy with new secret

## Quick Commands Reference

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Authenticate
stripe login

# Get webhook secret (one-time)
stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/ --print-secret

# Run webhook listener (daily development)
stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/

# Test webhook manually
stripe trigger payment_intent.succeeded

# View webhook logs
stripe logs tail

# Check CLI version
stripe version
```

## Additional Resources

- **Stripe Webhooks Documentation**: https://stripe.com/docs/webhooks
- **Stripe CLI Documentation**: https://stripe.com/docs/stripe-cli
- **Testing Webhooks**: https://stripe.com/docs/webhooks/test
- **Webhook Best Practices**: https://stripe.com/docs/webhooks/best-practices

## Support

If you encounter issues:

1. Check webhook logs in Stripe Dashboard
2. Check Django server logs for errors
3. Verify webhook secret matches between `.env` and Stripe
4. Test with `stripe trigger` command to manually send test events

---

**Last Updated**: 2025-11-20
