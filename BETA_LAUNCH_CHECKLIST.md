# FitConnect Beta Launch Readiness Checklist

## Overview

This checklist covers everything needed to launch FitConnect to beta users (trainers and clients). Focus is on **minimum viable product (MVP)** - not perfect, but stable and functional.

---

## ✅ COMPLETED ITEMS

### 1. Core Features
- [x] User authentication (login, signup, JWT tokens)
- [x] Trainer profiles (bio, photos, specializations, hourly rate)
- [x] Client profiles
- [x] Trainer search (location-based with radius)
- [x] Booking system (create, view, manage bookings)
- [x] Availability calendar for trainers
- [x] Payment processing (Stripe integration)
- [x] Payment confirmation emails
- [x] Booking confirmation emails
- [x] Media file handling (trainer photos, certifications)

### 2. Development Infrastructure
- [x] Django REST API backend
- [x] React frontend with Tailwind CSS
- [x] PostgreSQL database with PostGIS
- [x] Stripe test mode configured
- [x] Local development environment working
- [x] Git version control

### 3. Recent Beta Prep Work (Completed Today)
- [x] Media file configuration (MEDIA_ROOT, MEDIA_URL)
- [x] Payment confirmation email system (success, failure, refund)
- [x] Stripe webhook secret for local dev
- [x] End-to-end payment testing

---

## 🔴 CRITICAL BLOCKERS (Must Complete Before Beta)

### 1. Production Settings (2-3 hours)
**Why Critical**: Security vulnerabilities if deployed with DEBUG=True

**Tasks:**
- [ ] Generate new SECRET_KEY for production
- [ ] Set DEBUG=False in production .env
- [ ] Configure ALLOWED_HOSTS for production domain
- [ ] Set up CORS headers for production frontend URL
- [ ] Configure CSRF trusted origins
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite)

**How to Do**:
```bash
# Generate new SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# In production .env:
DEBUG=False
SECRET_KEY=<new_generated_key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
```

**Files to Update**:
- `backend/.env` (production version)
- `backend/fitconnect/settings.py` (if needed for CORS, CSRF)

---

### 2. Choose Deployment Platform (Decision Required)
**Why Critical**: Need somewhere to host the app

**Options**:

#### Option A: DigitalOcean App Platform (Recommended for Beta)
- **Pros**: Easy, managed, includes database, $20-40/month
- **Cons**: Less control, costs more than self-managed
- **Time**: 1-2 days setup
- **Best for**: Quick beta launch, no DevOps experience

#### Option B: AWS EC2 + RDS (More control)
- **Pros**: Flexible, scalable, widely used
- **Cons**: More complex, requires DevOps knowledge
- **Time**: 2-3 days setup
- **Best for**: Long-term scalability

#### Option C: Heroku (Easiest but more expensive)
- **Pros**: Simplest deployment, great for prototypes
- **Cons**: $16-25/month, less control
- **Time**: 1 day setup
- **Best for**: Rapid beta testing

**Recommendation**: **DigitalOcean App Platform** for beta
- Managed database (PostgreSQL with PostGIS)
- Automatic HTTPS
- Built-in environment variable management
- Easy scaling later

---

### 3. Production Database Setup (2-4 hours)
**Why Critical**: Need persistent data storage

**Tasks**:
- [ ] Create production PostgreSQL database (with PostGIS extension)
- [ ] Run migrations on production database
- [ ] Create Django superuser for admin access
- [ ] Backup strategy (automated daily backups)

**How to Do** (DigitalOcean example):
```bash
# After creating database in DigitalOcean:
# 1. Get connection string from DigitalOcean dashboard
# 2. Update production .env:
DATABASE_URL=postgresql://user:password@host:25060/fitconnect?sslmode=require

# 3. Run migrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser
```

---

### 4. Static & Media File Hosting (2-3 hours)
**Why Critical**: Trainer photos, static assets need to be served

**Options**:

#### Option A: DigitalOcean Spaces (Recommended)
- **Cost**: $5/month for 250GB
- **Setup**: S3-compatible API
- **CDN included**

#### Option B: AWS S3 + CloudFront
- **Cost**: ~$3-10/month (pay as you go)
- **More complex setup**

**Tasks**:
- [ ] Create Spaces/S3 bucket for media files
- [ ] Configure django-storages for S3-compatible storage
- [ ] Update MEDIA_URL and MEDIA_ROOT settings
- [ ] Upload existing trainer photos to cloud storage
- [ ] Configure STATIC_ROOT and collect static files
- [ ] Test file upload from production

**How to Do** (DigitalOcean Spaces):
```bash
# Install django-storages
pip install django-storages boto3

# In settings.py:
if not DEBUG:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = 'fitconnect-media'
    AWS_S3_ENDPOINT_URL = 'https://nyc3.digitaloceanspaces.com'
    AWS_S3_REGION_NAME = 'nyc3'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com'
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

---

### 5. Production Stripe Webhook (30 minutes)
**Why Critical**: Payment confirmations won't work without it

**Tasks**:
- [ ] Create webhook endpoint in Stripe Dashboard (Live mode)
- [ ] Configure webhook to listen to production URL
- [ ] Get production webhook signing secret
- [ ] Add to production environment variables
- [ ] Test webhook delivery

**How to Do**:
1. Go to https://dashboard.stripe.com
2. Switch to **Live mode** (toggle top right)
3. Navigate to: Developers → Webhooks
4. Click "Add endpoint"
5. Enter URL: `https://yourdomain.com/api/v1/payments/webhook/`
6. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
7. Copy signing secret (starts with `whsec_`)
8. Add to production .env:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
   ```

---

### 6. Production Email Configuration (1-2 hours)
**Why Critical**: Users won't receive booking/payment confirmations

**Options**:

#### Option A: SendGrid (Recommended for Production)
- **Cost**: Free tier (100 emails/day), $15/month (40k emails)
- **Pros**: Reliable, good deliverability, easy setup
- **Cons**: Requires API key

**Setup**:
```bash
pip install sendgrid

# In settings.py:
if not DEBUG:
    EMAIL_BACKEND = 'sendgrid_backend.SendgridBackend'
    SENDGRID_API_KEY = config('SENDGRID_API_KEY')
    DEFAULT_FROM_EMAIL = 'FitConnect <noreply@yourdomain.com>'
```

#### Option B: Gmail SMTP (Development/Small Beta)
- **Cost**: Free
- **Pros**: Easy, already configured
- **Cons**: 500 emails/day limit, less reliable

**Current**: You have Gmail configured - this is OK for initial beta (up to 500 emails/day)

**Tasks**:
- [ ] Verify current Gmail SMTP works in production
- [ ] OR set up SendGrid account
- [ ] Test sending emails from production
- [ ] Update email templates with production URL

---

### 7. Domain & SSL (1-2 hours)
**Why Critical**: Need a professional URL and secure connections

**Tasks**:
- [ ] Purchase domain (e.g., fitconnect.app, getfitconnect.com)
- [ ] Configure DNS records to point to deployment platform
- [ ] Set up SSL certificate (automatic on most platforms)
- [ ] Update SITE_URL in .env
- [ ] Update CORS and CSRF settings with production domain

**Recommended Domain Registrars**:
- Namecheap ($10-15/year)
- Google Domains ($12/year)
- Cloudflare ($9/year, includes DDoS protection)

**DNS Setup** (example for DigitalOcean):
```
Type: A
Host: @
Points to: <DigitalOcean IP>

Type: A
Host: www
Points to: <DigitalOcean IP>

Type: A
Host: api
Points to: <DigitalOcean IP>
```

---

### 8. Frontend Build & Deployment (2-3 hours)
**Why Critical**: Users need to access the frontend

**Options**:

#### Option A: Vercel (Recommended for React)
- **Cost**: Free for beta
- **Pros**: Auto-deploy on git push, great for React
- **Cons**: Separate from backend

#### Option B: DigitalOcean Static Site
- **Cost**: Included with App Platform
- **Pros**: Same platform as backend
- **Cons**: Less optimized for React

#### Option C: Netlify
- **Cost**: Free for beta
- **Pros**: Easy, good performance
- **Cons**: Separate from backend

**Tasks**:
- [ ] Build production React app: `npm run build`
- [ ] Configure environment variables (API URL)
- [ ] Deploy frontend to platform
- [ ] Test frontend loads and connects to backend API
- [ ] Configure custom domain

**Frontend .env for production**:
```
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
```

---

### 9. Switch to Stripe Live Mode (15 minutes)
**Why Critical**: Can't accept real payments in test mode

**Tasks**:
- [ ] Complete Stripe account verification (business info, bank account)
- [ ] Switch dashboard to Live mode
- [ ] Get live API keys (sk_live_, pk_live_)
- [ ] Update production .env with live keys
- [ ] Create production webhook endpoint (see #5)
- [ ] Test with real payment (charge $1, then refund)

**Stripe Verification Requirements**:
- Business information
- Tax ID (EIN or SSN)
- Bank account for payouts
- Identity verification (ID upload)

**Time**: 1-3 days for Stripe to verify account

---

## 🟡 IMPORTANT (Should Complete Before Beta)

### 10. Testing Checklist (1 day)
**Why Important**: Catch bugs before users do

**Tasks**:
- [ ] Test complete user flow as client (signup → search → book → pay)
- [ ] Test complete user flow as trainer (signup → set availability → receive booking)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Test payment flow with real card (charge $1, refund)
- [ ] Test email delivery (all email types)
- [ ] Test photo uploads (trainer photos, certifications)
- [ ] Verify all links work (forgot password, email links)

**Critical User Flows to Test**:
1. **Client Flow**:
   - Sign up → verify email → search trainers → view profile → book session → pay → receive confirmation
2. **Trainer Flow**:
   - Sign up → verify email → create profile → add photos → set availability → receive booking → accept/decline

---

### 11. Error Monitoring & Logging (2-3 hours)
**Why Important**: Know when things break

**Recommended**: Sentry (free tier covers beta)

**Tasks**:
- [ ] Set up Sentry account
- [ ] Install sentry-sdk in Django
- [ ] Configure Sentry in production settings
- [ ] Test error tracking (trigger a test error)
- [ ] Set up email alerts for critical errors

**Setup**:
```bash
pip install sentry-sdk

# In settings.py:
if not DEBUG:
    import sentry_sdk
    sentry_sdk.init(
        dsn=config('SENTRY_DSN'),
        traces_sample_rate=0.1,
    )
```

---

### 12. Basic Analytics (1 hour)
**Why Important**: Understand user behavior

**Recommended**: Google Analytics 4 (free)

**Tasks**:
- [ ] Create Google Analytics 4 property
- [ ] Add GA4 tracking code to React app
- [ ] Set up key events (signup, booking created, payment completed)
- [ ] Verify events are tracked

---

### 13. Admin Dashboard Access (30 minutes)
**Why Important**: Manage users, bookings, payments

**Tasks**:
- [ ] Create Django superuser in production
- [ ] Access admin at: https://yourdomain.com/admin/
- [ ] Verify can view/edit users, bookings, payments
- [ ] Create admin user account for yourself

---

### 14. Backup Strategy (1 hour)
**Why Important**: Don't lose data

**Tasks**:
- [ ] Configure automated database backups (daily)
- [ ] Test database restore process
- [ ] Document backup restoration steps
- [ ] Set up backup monitoring/alerts

**DigitalOcean**: Automatic backups included in managed database

---

## 🟢 NICE TO HAVE (Can Wait Until After Beta)

### 15. Performance Optimization
- [ ] Enable Django caching (Redis)
- [ ] Add database indexes for frequent queries
- [ ] Optimize API response times
- [ ] Image optimization (WebP format, lazy loading)

### 16. Advanced Features
- [ ] Admin API for managing users/bookings
- [ ] Trainer earnings dashboard
- [ ] Client booking history with search/filter
- [ ] Email notifications for booking reminders (24 hours before)
- [ ] SMS notifications (Twilio)
- [ ] In-app messaging (Stream Chat)

### 17. Documentation
- [ ] User guide for trainers
- [ ] User guide for clients
- [ ] FAQ page
- [ ] Privacy policy
- [ ] Terms of service

---

## 📊 ESTIMATED TIMELINE TO BETA

### Option 1: Quick Beta (3-5 days)
**Use**: DigitalOcean + Vercel + Gmail SMTP

| Task | Time |
|------|------|
| Production settings | 2 hours |
| DigitalOcean setup (database + backend) | 1 day |
| Vercel frontend deployment | 3 hours |
| Media files (DigitalOcean Spaces) | 2 hours |
| Stripe live mode setup | 2 hours |
| Domain + SSL | 2 hours |
| Testing | 1 day |
| **Total** | **3-4 days** |

### Option 2: Robust Beta (1-2 weeks)
**Use**: AWS + SendGrid + Sentry + Full testing

| Task | Time |
|------|------|
| All items from Option 1 | 3-4 days |
| SendGrid setup | 1 hour |
| Sentry error monitoring | 2 hours |
| Google Analytics | 1 hour |
| Comprehensive testing | 2 days |
| Documentation | 1 day |
| **Total** | **7-10 days** |

---

## 🚀 RECOMMENDED BETA LAUNCH PLAN

### Phase 1: Infrastructure Setup (Days 1-2)
1. Set up DigitalOcean account
2. Create managed PostgreSQL database (with PostGIS)
3. Create DigitalOcean Spaces for media files
4. Purchase domain and configure DNS
5. Deploy backend to DigitalOcean App Platform
6. Deploy frontend to Vercel

### Phase 2: Configuration (Day 3)
1. Configure production .env (all secrets)
2. Run database migrations
3. Set up Stripe live mode + production webhook
4. Configure media file storage (Spaces)
5. Test email delivery (Gmail SMTP)
6. Set up SSL (automatic)

### Phase 3: Testing (Day 4)
1. Test complete client flow
2. Test complete trainer flow
3. Test on multiple devices/browsers
4. Fix any critical bugs found

### Phase 4: Beta Launch (Day 5)
1. Invite 5-10 beta users (mix of trainers and clients)
2. Monitor error logs closely
3. Gather feedback
4. Fix bugs and iterate

---

## 💰 ESTIMATED MONTHLY COSTS (Beta)

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean App Platform | $20-30 | Backend hosting |
| DigitalOcean Managed Database | $15 | PostgreSQL |
| DigitalOcean Spaces | $5 | Media file storage (250GB) |
| Vercel | Free | Frontend hosting |
| Domain | $1-2 | (~$12-15/year) |
| Gmail SMTP | Free | Up to 500 emails/day |
| Stripe | 2.9% + 30¢ per transaction | No monthly fee |
| **Total** | **~$45/month** | Scales with usage |

**Optional**:
- SendGrid: $15/month (40k emails)
- Sentry: Free tier (covers beta)

---

## 📝 DEPLOYMENT CHECKLIST (Day of Launch)

**Pre-Launch (1 hour before)**:
- [ ] All critical items completed
- [ ] Production .env verified
- [ ] Database backed up
- [ ] Stripe live mode tested
- [ ] Payment flow tested with real card
- [ ] All email types tested
- [ ] Mobile responsiveness verified

**Launch**:
- [ ] Deploy latest code to production
- [ ] Run migrations if needed
- [ ] Clear caches
- [ ] Monitor error logs for 1 hour
- [ ] Test live site thoroughly
- [ ] Send invites to beta users

**Post-Launch**:
- [ ] Monitor Sentry for errors
- [ ] Check payment processing
- [ ] Verify emails are delivered
- [ ] Respond to user feedback quickly

---

## ✅ CURRENT STATUS

**You are here**: Completed local development and testing

**Next critical steps**:
1. **Choose deployment platform** (DigitalOcean recommended)
2. **Set up production settings** (2-3 hours)
3. **Deploy backend + database** (1 day)
4. **Deploy frontend** (3 hours)
5. **Configure Stripe live mode** (2 hours + verification time)
6. **Test end-to-end** (1 day)

**Estimated time to beta-ready**: **3-5 days of focused work**

**Recommended approach**: Start with DigitalOcean quick beta (3-4 days), then iterate based on user feedback.

---

**Last Updated**: 2025-11-21
