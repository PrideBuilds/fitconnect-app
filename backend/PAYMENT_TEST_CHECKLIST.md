# Payment Flow - End-to-End Test Checklist

## Purpose
Verify that the complete payment flow works correctly, including:
- Payment intent creation
- Stripe payment processing
- Webhook event handling
- Email notifications
- Database updates

## Pre-Test Setup

### ✅ Verify Services Running

```bash
# 1. Django server should be running
# Terminal 1:
cd backend
source venv/bin/activate
python manage.py runserver
# Should see: "Starting development server at http://127.0.0.1:8000/"

# 2. Frontend should be running
# Terminal 2:
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173/"

# 3. Stripe webhook listener should be running
# Terminal 3:
stripe listen --forward-to http://localhost:8000/api/v1/payments/webhook/
# Should see: "Ready! Your webhook signing secret is whsec_..."
```

### ✅ Verify Configuration

```bash
# Check .env has webhook secret
grep STRIPE_WEBHOOK_SECRET backend/.env
# Should show: STRIPE_WEBHOOK_SECRET=whsec_18fc...

# Check email backend (for seeing emails in console)
grep EMAIL_BACKEND backend/.env
# Should show: EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# OR: EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend (for real emails)
```

---

## Test Scenario 1: Successful Payment

### Steps to Test

1. **Login as Client**
   - Go to http://localhost:5173
   - Login with client credentials
   - Navigate to "My Bookings"

2. **Find a Pending Booking**
   - Look for a booking with status "Pending" or "Confirmed"
   - Click "Pay Now" button

3. **Complete Payment Form**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/28`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `10001`)
   - Click "Pay" button

4. **Wait for Processing**
   - Should see loading spinner
   - Should redirect to confirmation page or bookings list

### Expected Results

#### ✅ Frontend Behavior
- [ ] Payment form shows Stripe PaymentElement
- [ ] Form submits without errors
- [ ] Success message appears
- [ ] Booking status updates to "Paid"

#### ✅ Backend API Logs (Django Terminal)
- [ ] `POST /api/v1/payments/create-payment-intent/` returns 201 or 200
- [ ] `POST /api/v1/payments/confirm/` returns 200 (if using manual confirmation)
- [ ] No 500 errors in Django logs

#### ✅ Webhook Events (Stripe Listen Terminal)
Look for these webhook events in order:
- [ ] `payment_intent.created` - Payment intent created
- [ ] `payment_intent.succeeded` - Payment completed successfully
- [ ] Webhook returns status 200 (successful handling)

Example webhook output:
```
2025-11-21 05:11:22   --> payment_intent.created [evt_...]
2025-11-21 05:11:23   --> payment_intent.succeeded [evt_...]
2025-11-21 05:11:23   <-- [200] POST http://localhost:8000/api/v1/payments/webhook/ [evt_...]
```

#### ✅ Email Sent (Django Terminal or Email Inbox)
If using **console backend**, look in Django server terminal for:
```
Content-Type: text/plain; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Subject: Payment Confirmed - $80.00 for Training Session
From: FitConnect <creativeroderick@gmail.com>
To: client@example.com

Payment Confirmed - FitConnect

Hi Client Name,

Your payment for the training session with Trainer Name has been processed successfully.

PAYMENT DETAILS
---------------
Amount Paid: $80.00 USD
Payment ID: #1
...
```

If using **SMTP backend**, check your email inbox.

#### ✅ Database Updates
Verify in Django admin or API:
- [ ] Payment status = 'succeeded'
- [ ] Booking payment_status = 'paid'
- [ ] Payment has charge_id, receipt_url, card details

You can check via API:
```bash
# Get payments (replace JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/api/v1/payments/

# Or check booking details
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/api/v1/bookings/BOOKING_ID/
```

---

## Test Scenario 2: Failed Payment

### Steps to Test

1. **Create/Select a Pending Booking**
2. **Use a Declined Test Card**
   - Card: `4000 0000 0000 9995` (Generic decline)
   - Expiry: `12/28`
   - CVC: `123`
   - ZIP: `10001`
3. **Submit Payment**

### Expected Results

#### ✅ Frontend Behavior
- [ ] Error message appears: "Your card was declined"
- [ ] Booking status remains "Pending" or "Confirmed" (not "Paid")
- [ ] User can retry payment

#### ✅ Webhook Events
- [ ] `payment_intent.payment_failed` webhook received
- [ ] Webhook handler processes failure

#### ✅ Email Sent
- [ ] Payment failure email sent to client
- [ ] Email includes error message and retry button
- [ ] Subject: "Payment Failed - Action Required"

#### ✅ Database Updates
- [ ] Payment status = 'failed'
- [ ] Failure reason stored in payment record
- [ ] Booking payment_status = 'pending' (not 'paid')

---

## Test Scenario 3: 3D Secure Authentication

### Steps to Test

1. **Create/Select a Pending Booking**
2. **Use a 3D Secure Test Card**
   - Card: `4000 0025 0000 3155` (Requires authentication)
   - Expiry: `12/28`
   - CVC: `123`
   - ZIP: `10001`
3. **Submit Payment**
4. **Complete 3D Secure Challenge**
   - Stripe will show a popup modal
   - Click "Complete" or "Fail" button to test success/failure

### Expected Results

#### ✅ With Successful Authentication
- [ ] 3D Secure modal appears
- [ ] After completing, payment succeeds
- [ ] Same success behavior as Scenario 1

#### ✅ With Failed Authentication
- [ ] User clicks "Fail" in 3D Secure modal
- [ ] Payment fails with authentication error
- [ ] Same failure behavior as Scenario 2

---

## Test Scenario 4: Refund Processing

### Steps to Test

1. **Find a Paid Booking**
   - Must have payment status = 'succeeded'
2. **Login as Admin or Trainer** (whoever can process refunds)
3. **Navigate to Payment Details**
4. **Process Refund**
   - Enter refund amount (full or partial)
   - Enter refund reason
   - Submit refund request

### Expected Results

#### ✅ Frontend Behavior
- [ ] Refund form validates amount
- [ ] Success message after refund
- [ ] Payment shows refund amount

#### ✅ Webhook Events
- [ ] `charge.refunded` webhook received

#### ✅ Email Sent
- [ ] Refund confirmation email sent to client
- [ ] Email shows refund amount, reason, processing time
- [ ] Subject: "Refund Processed - $XX.XX"

#### ✅ Database Updates
- [ ] Payment refunded_amount updated
- [ ] Payment status = 'refunded' (if full) or 'succeeded' (if partial)
- [ ] Booking payment_status = 'refunded' (if full)

---

## Test Scenario 5: Webhook Signature Verification

### Steps to Test

1. **Temporarily Change Webhook Secret**
   ```bash
   # In .env, change to wrong secret
   STRIPE_WEBHOOK_SECRET=whsec_invalid_secret
   ```
2. **Restart Django Server** (to load new .env)
3. **Attempt a Payment**

### Expected Results

#### ✅ Security Check
- [ ] Webhook handler rejects event
- [ ] Django logs show: "Invalid webhook signature"
- [ ] Returns HTTP 400 to Stripe
- [ ] Payment does NOT update in database

4. **Restore Correct Secret**
   ```bash
   # Restore in .env
   STRIPE_WEBHOOK_SECRET=whsec_18fc1115c202fedf6cd3ed85e310875eceb8da87af49ae3d8f02e4fd88f2ae43
   ```
5. **Restart Django Server**
6. **Retry Payment** - Should work now

---

## Common Issues & Solutions

### Issue 1: Webhooks Not Received

**Symptom**: Payment succeeds in frontend but database not updated

**Check**:
```bash
# Is stripe listen running?
ps aux | grep "stripe listen"

# Check Django logs for webhook errors
# Terminal 1 (Django server) should show:
# POST /api/v1/payments/webhook/ [200]
```

**Solution**:
- Restart `stripe listen` command
- Verify webhook secret in .env matches Stripe CLI output
- Restart Django server after changing .env

### Issue 2: Email Not Sent

**Symptom**: Payment succeeds but no email in console/inbox

**Check**:
```bash
# What email backend is configured?
grep EMAIL_BACKEND backend/.env
```

**Solution**:
- For console: Check Django server terminal for email content
- For SMTP: Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
- Check Django logs for email errors

### Issue 3: Payment Intent Already Exists

**Symptom**: Error "PaymentIntent already exists" when creating payment

**Explanation**: This is normal behavior - the app reuses the same PaymentIntent if you revisit the payment page

**Solution**: No action needed. The existing PaymentIntent will be used.

### Issue 4: Card Declined in Test Mode

**Symptom**: Real card declined in test mode

**Explanation**: Only Stripe test cards work in test mode

**Solution**: Use test card `4242 4242 4242 4242` instead of real card

---

## Checklist Summary

After completing all test scenarios, verify:

### Payment Success Flow
- [x] Payment intent created successfully
- [x] Stripe payment processes correctly
- [x] Webhook `payment_intent.succeeded` received and handled
- [x] Payment confirmation email sent to client
- [x] Database updated (payment status = 'succeeded', booking status = 'paid')
- [x] Receipt URL stored in payment record

### Payment Failure Flow
- [ ] Payment declined correctly
- [ ] Webhook `payment_intent.payment_failed` received
- [ ] Payment failure email sent with retry instructions
- [ ] Database updated (payment status = 'failed', booking status = 'pending')

### Refund Flow
- [ ] Refund processed via Stripe
- [ ] Webhook `charge.refunded` received
- [ ] Refund confirmation email sent
- [ ] Database updated with refund amount

### Security
- [ ] Invalid webhook signatures rejected
- [ ] Payment data not exposed in frontend

### Email Notifications
- [ ] Payment confirmation email has correct details
- [ ] Payment failure email has error message and retry button
- [ ] Refund confirmation email has refund details
- [ ] Emails have professional formatting (HTML + plain text)

---

## Next Steps After Testing

Once all tests pass:

1. **Document any issues found** and fix them
2. **Test with different browsers** (Chrome, Firefox, Safari)
3. **Test on mobile devices** (iOS, Android)
4. **Update to production webhook secret** when deploying
5. **Switch to live Stripe keys** when ready for real payments

---

## Test Data Reference

### Stripe Test Cards

| Card Number          | Behavior                         |
|---------------------|----------------------------------|
| 4242 4242 4242 4242 | Success                         |
| 4000 0025 0000 3155 | Requires 3D Secure              |
| 4000 0000 0000 9995 | Generic decline                 |
| 4000 0000 0000 0002 | Card declined                   |
| 4000 0000 0000 9987 | Insufficient funds              |

Full list: https://stripe.com/docs/testing

### Test User Accounts

Create test accounts for:
- Client (to make bookings and payments)
- Trainer (to receive payments)
- Admin (to process refunds)

---

**Last Updated**: 2025-11-21
