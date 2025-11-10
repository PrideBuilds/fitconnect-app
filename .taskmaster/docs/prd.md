# Product Requirements Document: FitConnect

## Executive Summary

FitConnect is a peer-to-peer marketplace connecting travelers with personal trainers and gyms across different cities in the United States. Like Airbnb for fitness, FitConnect solves the problem of travelers struggling to maintain their fitness routine by making it easy to discover, book, and pay for training sessions anywhere they go. The platform will launch with an MVP focused on search, matching, and booking, with subsequent phases adding payments and advanced features.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Success Metrics](#goals--success-metrics)
3. [User Stories](#user-stories)
4. [Functional Requirements](#functional-requirements)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [Technical Considerations](#technical-considerations)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Out of Scope](#out-of-scope)
9. [Open Questions & Risks](#open-questions--risks)
10. [Validation Checkpoints](#validation-checkpoints)

---

## Problem Statement

### Current Situation
Travelers who maintain active fitness routines face significant challenges when visiting new cities:
- **Discovery Problem**: No centralized platform to find qualified trainers or gyms in unfamiliar locations
- **Quality Uncertainty**: Difficulty verifying trainer credentials and reading authentic reviews
- **Booking Friction**: Must navigate multiple websites, phone calls, and payment methods
- **Time Waste**: Searching Google, calling gyms, and coordinating schedules eats into travel time

### User Impact
**For Travelers (Clients):**
- Lost workout momentum during business trips or vacations
- Anxiety about gym quality and safety in unfamiliar areas
- Time wasted on research instead of training
- Inconsistent fitness progress due to travel disruptions

**For Trainers & Gyms:**
- Missed revenue from transient clients who don't know they exist
- Empty time slots that could be filled by drop-in clients
- Limited marketing reach beyond local residents
- No platform to showcase credentials to traveling professionals

### Business Impact
- **Market Opportunity**: 465 million domestic business trips annually in US (2023), with 67% of business travelers seeking to maintain fitness routines
- **Revenue Loss**: Trainers lose estimated $15K-25K annually in potential drop-in client revenue
- **Inefficiency Cost**: Travelers spend avg. 2-3 hours researching gyms per trip

### Why Solve This Now
1. **Post-Pandemic Travel Surge**: Business travel rebounding to 80% of pre-pandemic levels
2. **Wellness Trend**: Corporate wellness programs now emphasize travel fitness (42% of companies in 2024)
3. **Gig Economy Acceptance**: Consumers comfortable with peer-to-peer marketplaces (Airbnb, Uber model proven)
4. **Technology Readiness**: Stripe, Google Maps APIs make implementation feasible for MVP

---

## Goals & Success Metrics

### Goal 1: Enable Seamless Trainer Discovery
**Metric**: Location-based search returns relevant results
**Baseline**: 0 (new platform)
**Target**: 90% of searches return at least 5 relevant trainers within 5 miles
**Timeframe**: Phase 1 MVP (Weeks 1-4)

### Goal 2: Drive Booking Completion
**Metric**: Booking conversion rate (searches → completed bookings)
**Baseline**: 0%
**Target**: 15% conversion rate within first 3 months post-launch
**Timeframe**: Phase 2 (Months 2-3)

### Goal 3: Build Two-Sided Marketplace
**Metric**: Trainer-to-client ratio
**Baseline**: 0
**Target**: 1:10 ratio (1 trainer per 10 clients) with minimum 100 trainers nationwide
**Timeframe**: Phase 1-2 (Months 1-3)

### Goal 4: Ensure Platform Quality
**Metric**: Average trainer rating
**Baseline**: N/A
**Target**: 4.5+ stars average across all trainers with reviews
**Timeframe**: Phase 2 (Month 3)

### Goal 5: Achieve Revenue Viability
**Metric**: Platform transaction volume
**Baseline**: $0
**Target**: $50K GMV (Gross Merchandise Value) in first 6 months
**Timeframe**: Phase 2-3 (Months 3-6)

---

## User Stories

### Epic 1: Client (Traveler) Journey

#### US-001: Discover Trainers by Location
**As a** business traveler
**I want to** search for personal trainers near my hotel in a new city
**So that I can** maintain my fitness routine while traveling

**Acceptance Criteria:**
- Can enter city, zip code, or address in search bar
- Results display trainers within configurable radius (default 5 miles)
- Each result shows: trainer name, photo, specializations, distance, hourly rate
- Map view shows all trainers as pins with clustering for dense areas
- Can filter by: specialization (strength, yoga, HIIT, etc.), availability (date/time), price range
- Search returns results in <2 seconds for 95th percentile queries
- Mobile-responsive design works on iOS/Android browsers

**Task Breakdown Hints:**
- TASK-001: Build search UI component (React + Tailwind)
- TASK-002: Implement Google Maps integration with marker clustering
- TASK-003: Create Django API endpoint for location-based search with PostGIS
- TASK-004: Add filter sidebar with dynamic query building

---

#### US-002: View Trainer Profile Details
**As a** potential client
**I want to** view a trainer's full profile with credentials, photos, and availability
**So that I can** make an informed booking decision

**Acceptance Criteria:**
- Profile page shows: bio (max 500 chars), certifications, specializations, years of experience
- Photo gallery (min 3 photos: headshot, training space, credentials)
- Verified badge displayed if background check completed
- Availability calendar shows next 30 days with open/booked slots
- Pricing clearly displayed (hourly rate, package discounts if applicable)
- Location shown on embedded Google Map
- "Book Now" CTA button prominently displayed
- Load time <1.5 seconds for profile page

**Task Breakdown Hints:**
- TASK-005: Design trainer profile page layout (Figma or Tailwind components)
- TASK-006: Build Django model for trainer profiles with file upload
- TASK-007: Implement availability calendar component (React Big Calendar or similar)
- TASK-008: Create trainer profile view API endpoint

---

#### US-003: Book Training Session
**As a** client
**I want to** select a date/time and book a session with a trainer
**So that I can** secure my workout slot

**Acceptance Criteria:**
- Can select date and available time slot from calendar
- Booking form collects: session type (1-on-1, small group), duration (30/60/90 min), special requests (text field)
- System prevents double-booking (pessimistic locking on time slot)
- Confirmation page shows: trainer name, date/time, location, price breakdown
- Confirmation email sent to both client and trainer within 30 seconds
- Booking stored in database with status: "pending" (Phase 1), "confirmed" (Phase 2 after payment)
- Can cancel booking up to 24 hours in advance (Phase 2)

**Task Breakdown Hints:**
- TASK-009: Build booking form component with date/time picker
- TASK-010: Create Django booking model with foreign keys to user and trainer
- TASK-011: Implement booking API with transaction handling
- TASK-012: Set up email notification system (Django email backend + templates)
- TASK-013: Add booking confirmation page with booking details

---

### Epic 2: Trainer/Gym Journey

#### US-004: Create Trainer Profile
**As a** personal trainer
**I want to** create a profile showcasing my credentials and services
**So that I can** attract traveling clients

**Acceptance Criteria:**
- Registration form collects: full name, email, phone, business name (optional), address
- Profile setup wizard guides through: bio, certifications upload (PDF/image), specializations (multi-select), pricing
- Can upload minimum 3 photos (profile pic required, training space, certifications)
- Set hourly rate with option for package pricing (Phase 2)
- Choose service radius (e.g., "I travel to clients within 10 miles")
- Profile preview before publishing
- Background check prompt with link to third-party service (Checkr integration in Phase 3)
- Email verification required before profile goes live

**Task Breakdown Hints:**
- TASK-014: Build multi-step profile creation form (React Hook Form + Tailwind)
- TASK-015: Create Django user model with trainer/client roles
- TASK-016: Implement file upload for photos and certifications (AWS S3 or local storage)
- TASK-017: Add email verification flow (Django confirmation tokens)
- TASK-018: Create profile approval admin view (Django admin customization)

---

#### US-005: Manage Availability Calendar
**As a** trainer
**I want to** set my available hours and block off unavailable times
**So that I can** control my schedule and prevent booking conflicts

**Acceptance Criteria:**
- Calendar view shows next 90 days with day/week/month views
- Can set recurring availability (e.g., "Mon-Fri 6am-8pm")
- Can block specific dates/times for personal time off
- Can mark slots as "available" or "unavailable" with drag-to-select
- Existing bookings shown as "booked" (non-editable by trainer)
- Changes save immediately with optimistic UI updates
- Syncs with Google Calendar (Phase 2 stretch goal)

**Task Breakdown Hints:**
- TASK-019: Build availability calendar component (React Big Calendar or FullCalendar)
- TASK-020: Create Django availability model with time slot records
- TASK-021: Implement recurring availability logic (cron-like pattern)
- TASK-022: Add drag-to-select interaction for bulk availability setting
- TASK-023: Create availability management API endpoints

---

#### US-006: Receive and Manage Bookings
**As a** trainer
**I want to** see incoming booking requests and manage my schedule
**So that I can** coordinate with clients and track my sessions

**Acceptance Criteria:**
- Dashboard shows upcoming bookings in chronological order
- Each booking displays: client name, date/time, session type, special requests
- Email notification sent immediately when new booking created
- Can view client contact info (email, phone) after booking confirmed
- Booking statuses: Pending → Confirmed (Phase 2 after payment) → Completed → Cancelled
- Can send messages to client (Phase 2)
- Booking history view shows past sessions

**Task Breakdown Hints:**
- TASK-024: Build trainer dashboard with booking list component
- TASK-025: Create booking notification system (email + in-app)
- TASK-026: Implement booking detail view with client info
- TASK-027: Add booking status management workflow

---

## Functional Requirements

### Phase 1: MVP - Core Matching & Booking

#### REQ-001: User Authentication (Must Have)
**Priority**: Must Have
**Description**: Secure user registration and login for both clients and trainers

**Specifications:**
- Email/password authentication with Django's built-in auth
- Password requirements: min 8 characters, 1 uppercase, 1 number, 1 special char
- Email verification via confirmation token (Django ConfirmEmailView)
- Password reset via email link
- Session management with 30-day "remember me" option
- Role-based access: Client, Trainer, Admin

**Acceptance Criteria:**
- User can register with email/password
- Email confirmation required before login
- Password reset link expires after 24 hours
- Sessions persist for 30 days if "remember me" checked
- Users assigned correct role (client or trainer) during registration

**Implementation Hints:**
- Use Django's `AbstractUser` or extend `User` model with `Profile` model
- Leverage `django.contrib.auth` for authentication views
- Consider `django-allauth` for social auth in future
- TASK-028: Implement user registration and login (4-6 hours)

---

#### REQ-002: Location-Based Trainer Search (Must Have)
**Priority**: Must Have
**Description**: Search for trainers using address, city, or zip code with map visualization

**Specifications:**
- Google Maps Places API for address autocomplete
- Google Maps JavaScript API for map rendering
- PostGIS extension for PostgreSQL for geospatial queries
- Search radius: 5/10/25/50 mile options (default 5 miles)
- Results sorted by distance (ascending)
- Pagination: 20 results per page

**API Endpoint Example:**
```
GET /api/v1/trainers/search?location=37.7749,-122.4194&radius=5&specialization=yoga&min_price=50&max_price=150

Response (200):
{
  "count": 45,
  "next": "/api/v1/trainers/search?page=2...",
  "previous": null,
  "results": [
    {
      "id": "uuid-1234",
      "name": "Jane Doe",
      "profile_photo": "https://cdn.fitconnect.com/photos/jane.jpg",
      "specializations": ["Yoga", "Pilates"],
      "distance_miles": 1.2,
      "hourly_rate": 75,
      "average_rating": 4.8,
      "verified": true,
      "location": {
        "lat": 37.7849,
        "lng": -122.4294
      }
    }
  ]
}
```

**Acceptance Criteria:**
- Search returns results within specified radius sorted by distance
- Map displays trainer markers with info windows on click
- Filters (specialization, price range) narrow results correctly
- Search completes in <2 seconds for 95th percentile
- No results state displays helpful message with expanded radius suggestion

**Implementation Hints:**
- Install `django-postgis` and enable PostGIS extension
- Use `ST_DWithin` for radius queries on `location` geography field
- Implement marker clustering for dense areas (MarkerClusterer library)
- TASK-029: Set up PostGIS and location models (2-3 hours)
- TASK-030: Build search API with geospatial queries (4-6 hours)
- TASK-031: Integrate Google Maps with marker display (3-4 hours)

---

#### REQ-003: Trainer Profile Management (Must Have)
**Priority**: Must Have
**Description**: Trainers can create, edit, and publish detailed profiles

**Specifications:**
- Profile fields: name, bio (max 500 chars), certifications, specializations (multi-select), address, hourly rate
- Photo upload: min 1 (profile pic), max 10 photos, file size limit 5MB per photo, formats: JPG/PNG
- Certification upload: max 5 PDFs, file size limit 10MB per file
- Address geocoded to lat/lng on save using Google Geocoding API
- Profile status: Draft → Published (requires email verification)
- SEO-friendly URL slug: `/trainers/jane-doe-san-francisco`

**Database Schema:**
```python
class TrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500)
    specializations = models.ManyToManyField(Specialization)
    address = models.CharField(max_length=255)
    location = models.PointField(geography=True)  # PostGIS
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    verified = models.BooleanField(default=False)
    profile_photo = models.ImageField(upload_to='trainers/photos/')
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Acceptance Criteria:**
- Trainer can save profile as draft and return to edit later
- Address automatically geocoded to lat/lng on save
- Profile URL is SEO-friendly slug (auto-generated from name + city)
- Photo uploads compressed to max 1920px width (preserve aspect ratio)
- Profile not visible in search until status = "Published"

**Implementation Hints:**
- Use `django-imagekit` for image processing and thumbnails
- Generate slug with `django.utils.text.slugify` + uniqueness check
- Store files in AWS S3 (Phase 2) or local media folder (MVP)
- TASK-032: Create trainer profile models (2-3 hours)
- TASK-033: Build profile creation form with file uploads (4-6 hours)
- TASK-034: Implement geocoding on address save (2 hours)

---

#### REQ-004: Availability Calendar (Must Have)
**Priority**: Must Have
**Description**: Trainers set available time slots; clients view availability before booking

**Specifications:**
- Calendar displays 90 days from today
- Time slots: 30-minute increments (e.g., 6:00 AM, 6:30 AM, etc.)
- Recurring availability: trainers set weekly schedule (e.g., Mon-Fri 6 AM - 8 PM)
- Override specific dates: trainers block days off or add special availability
- Availability statuses: Available, Booked, Blocked
- Real-time updates: when client books, slot immediately becomes "Booked"

**Database Schema:**
```python
class AvailabilitySlot(models.Model):
    trainer = models.ForeignKey(TrainerProfile, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(choices=['available', 'booked', 'blocked'])
    booking = models.ForeignKey(Booking, null=True, blank=True)

    class Meta:
        unique_together = ['trainer', 'start_time']
        indexes = [
            models.Index(fields=['trainer', 'start_time', 'status'])
        ]
```

**Acceptance Criteria:**
- Trainer can set recurring weekly availability (saves individual slots per day)
- Trainer can block specific dates with one click (batch update slots)
- Calendar UI shows color-coded slots: green (available), red (booked), gray (blocked)
- When client books, slot status updates from "available" to "booked" atomically
- No double-booking possible (database constraint + pessimistic locking)

**Implementation Hints:**
- Use `react-big-calendar` or `@fullcalendar/react` for calendar UI
- Generate availability slots on trainer schedule save (celery task for async processing)
- Implement row-level locking with `select_for_update()` during booking
- TASK-035: Build availability calendar UI (4-6 hours)
- TASK-036: Create availability slot models and API (4-5 hours)
- TASK-037: Implement recurring availability generation (3-4 hours)

---

#### REQ-005: Booking System (Must Have)
**Priority**: Must Have
**Description**: Clients can book available time slots with trainers

**Specifications:**
- Booking flow: Select trainer → Choose date/time → Fill booking form → Confirm
- Booking form fields: session type (1-on-1, small group), duration (30/60/90 min), special requests (textarea)
- Session duration options map to consecutive time slots (60 min = 2 slots if 30-min increments)
- Price calculation: hourly_rate * (duration / 60)
- Booking confirmation: email sent to client and trainer with booking details
- Booking statuses: Pending (Phase 1) → Confirmed (Phase 2 after payment)

**API Endpoint Example:**
```
POST /api/v1/bookings/

Request:
{
  "trainer_id": "uuid-1234",
  "start_time": "2025-11-15T10:00:00Z",
  "duration_minutes": 60,
  "session_type": "1-on-1",
  "special_requests": "Focus on lower body strength"
}

Response (201):
{
  "booking_id": "uuid-5678",
  "status": "pending",
  "trainer": {
    "name": "Jane Doe",
    "profile_photo": "..."
  },
  "start_time": "2025-11-15T10:00:00Z",
  "end_time": "2025-11-15T11:00:00Z",
  "total_price": 75.00,
  "confirmation_code": "FC-1234ABCD"
}

Error (409 - Conflict):
{
  "error": "SLOT_UNAVAILABLE",
  "message": "This time slot is no longer available",
  "available_nearby": [
    "2025-11-15T11:00:00Z",
    "2025-11-15T14:00:00Z"
  ]
}
```

**Acceptance Criteria:**
- Booking transaction is atomic (all-or-nothing using database transaction)
- Prevents double-booking with row-level locking
- Confirmation email sent within 30 seconds of booking creation
- Booking appears in both client and trainer dashboards immediately
- Cannot book time slots in the past (validation error)
- Cannot book with less than 2 hours notice (configurable)

**Implementation Hints:**
- Use Django's `transaction.atomic()` for booking creation
- Lock availability slots with `select_for_update()` before booking
- Generate unique confirmation code (8 alphanumeric characters)
- Use Celery for async email sending (optional for MVP, can be synchronous)
- TASK-038: Create booking models and API (4-6 hours)
- TASK-039: Build booking form UI (3-4 hours)
- TASK-040: Implement email notifications (2-3 hours)

---

#### REQ-006: User Dashboards (Must Have)
**Priority**: Must Have
**Description**: Role-specific dashboards for clients and trainers

**Client Dashboard:**
- Upcoming bookings list (chronological order)
- Past bookings with "Rebook" button
- Saved/favorite trainers (Phase 2)
- Account settings: email, password, profile photo

**Trainer Dashboard:**
- Today's schedule at top (upcoming sessions)
- Pending bookings requiring action (Phase 2 - accept/decline)
- Earnings summary: today, this week, this month (Phase 2)
- Quick actions: Update availability, Edit profile
- Account settings

**Acceptance Criteria:**
- Dashboard loads in <1 second
- Booking list shows next 30 days by default
- Empty state displays helpful onboarding message
- Mobile-responsive design (stack elements vertically on small screens)

**Implementation Hints:**
- Use React Router protected routes for dashboard access
- Fetch data with React Query for caching and optimistic updates
- TASK-041: Build client dashboard (3-4 hours)
- TASK-042: Build trainer dashboard (3-4 hours)

---

### Phase 2: Payments & Reviews

#### REQ-007: Stripe Payment Integration (Must Have)
**Priority**: Must Have (Phase 2)
**Description**: Secure payment processing for bookings via Stripe

**Specifications:**
- Stripe Connect for marketplace payments (platform takes commission)
- Payment flow: Client pays at booking → Stripe holds funds → Released to trainer after session completed
- Platform fee: 15% of booking total (configurable)
- Payment methods: Credit/debit cards via Stripe Elements
- Refund policy: Full refund if cancelled >24 hours in advance, 50% if 12-24 hours, no refund <12 hours

**API Endpoint Example:**
```
POST /api/v1/bookings/{id}/payment/

Request:
{
  "payment_method_id": "pm_1234567890",
  "save_payment_method": true
}

Response (200):
{
  "payment_intent_id": "pi_abcdef",
  "status": "succeeded",
  "amount": 75.00,
  "platform_fee": 11.25,
  "trainer_payout": 63.75
}
```

**Acceptance Criteria:**
- Payment required before booking confirmed
- Client receives receipt email after successful payment
- Trainer sees "Pending Payout" status until session completed
- Admin dashboard shows platform revenue and pending payouts
- PCI compliance maintained (no credit card data stored on server)

**Implementation Hints:**
- Use `stripe-python` SDK and `@stripe/stripe-js` for frontend
- Implement Stripe webhooks for payment status updates
- Store Stripe customer IDs and payment method IDs for saved cards
- TASK-043: Set up Stripe Connect accounts (4-6 hours)
- TASK-044: Integrate Stripe payment flow (6-8 hours)
- TASK-045: Implement refund logic (3-4 hours)

---

#### REQ-008: Review & Rating System (Must Have)
**Priority**: Must Have (Phase 2)
**Description**: Clients can rate and review trainers after sessions

**Specifications:**
- Star rating: 1-5 stars (required)
- Written review: 50-500 characters (optional)
- Can review within 30 days after session completion
- Reviews are public and displayed on trainer profile
- Average rating calculated and cached on trainer profile
- Trainers can respond to reviews (Phase 3)

**Database Schema:**
```python
class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    client = models.ForeignKey(User, on_delete=models.CASCADE)
    trainer = models.ForeignKey(TrainerProfile, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(1,1), (2,2), (3,3), (4,4), (5,5)])
    review_text = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['booking', 'client']
```

**Acceptance Criteria:**
- Review prompt sent via email 24 hours after session
- Cannot review same booking twice
- Average rating recalculated on new review submission
- Reviews display on trainer profile ordered by most recent

**Implementation Hints:**
- Use Celery beat for scheduled review reminder emails
- Cache average rating using Django signals on review save
- TASK-046: Create review models and API (3-4 hours)
- TASK-047: Build review submission UI (3-4 hours)
- TASK-048: Display reviews on trainer profile (2 hours)

---

#### REQ-009: In-App Messaging (Should Have)
**Priority**: Should Have (Phase 2)
**Description**: Clients and trainers can message each other about bookings

**Specifications:**
- Messages scoped to specific booking (conversation thread)
- Real-time messaging using Django Channels + WebSockets (or fallback to polling)
- Message notifications via email if recipient offline
- Message history preserved indefinitely
- Character limit: 1000 characters per message

**Acceptance Criteria:**
- Messages appear in real-time if both users online
- Email notification sent if recipient hasn't read message in 15 minutes
- Message thread accessible from booking detail page
- Cannot message users without active booking (prevent spam)

**Implementation Hints:**
- Use `django-channels` for WebSocket support
- Consider simpler polling approach for MVP (check every 10 seconds)
- TASK-049: Set up Django Channels (4-6 hours)
- TASK-050: Build messaging UI (4-6 hours)
- TASK-051: Implement message notifications (2-3 hours)

---

### Phase 3: Advanced Features

#### REQ-010: Admin Dashboard (Must Have)
**Priority**: Must Have (Phase 3)
**Description**: Admin panel for platform management and analytics

**Specifications:**
- User management: view/edit/suspend users, approve trainer profiles
- Booking oversight: view all bookings, resolve disputes
- Analytics dashboard:
  - Total users (clients, trainers)
  - Booking volume (daily, weekly, monthly)
  - Revenue metrics (GMV, platform fees collected)
  - Top trainers by bookings and ratings
  - Geographic heatmap of bookings
- Reported content review (Phase 3 - user reports)

**Acceptance Criteria:**
- Admin role has access to Django admin + custom admin dashboard
- Analytics refresh daily (cached, not real-time)
- Can export data as CSV for external analysis
- Audit log tracks admin actions (user suspensions, profile edits)

**Implementation Hints:**
- Extend Django admin with custom views
- Use Chart.js or Recharts for analytics visualizations
- Cache analytics with Redis (expire every 24 hours)
- TASK-052: Build admin analytics dashboard (6-8 hours)
- TASK-053: Add user management admin views (4-5 hours)

---

#### REQ-011: Background Check Integration (Should Have)
**Priority**: Should Have (Phase 3)
**Description**: Integrate with third-party background check service for trainer verification

**Specifications:**
- Integrate with Checkr API for background checks
- Trainer initiates check from profile settings
- Background check includes: criminal records, sex offender registry
- Check status: Pending → Clear → Consider (manual review) → Suspended
- Verified badge displayed on profile if check clears
- Re-verification required every 12 months

**Acceptance Criteria:**
- Trainer can initiate background check with one click
- Webhook from Checkr updates verification status automatically
- Admin can manually override verification decision
- Expired verifications trigger email reminder

**Implementation Hints:**
- Use Checkr Sandbox API for development/testing
- Store verification expiry date and check with Celery beat
- TASK-054: Integrate Checkr API (4-6 hours)
- TASK-055: Add verification badge UI (2 hours)

---

#### REQ-012: Advanced Search Filters (Could Have)
**Priority**: Could Have (Phase 3)
**Description**: Enhanced search with more filter options

**Specifications:**
- Filter by: gender preference, languages spoken, training location (gym, client's home, outdoor)
- Sort by: distance, price (low to high, high to low), rating, years of experience
- Search by keyword: trainer name, bio text, certifications
- Save search preferences for future visits

**Acceptance Criteria:**
- All filters work in combination (AND logic)
- Filters persist in URL query params (shareable links)
- Saved searches accessible from client dashboard

**Implementation Hints:**
- Use Django Q objects for complex filter queries
- Implement full-text search with PostgreSQL tsvector (or Elasticsearch)
- TASK-056: Add advanced filter UI (3-4 hours)
- TASK-057: Extend search API with new filters (3-4 hours)

---

## Non-Functional Requirements

### Performance

#### NFR-001: Page Load Time
**Target**: <2 seconds for 95th percentile page loads
**Measurement**: Google Lighthouse, Chrome DevTools Performance tab
**Implementation**:
- Code splitting with React lazy loading
- Image optimization (WebP format, lazy loading)
- CDN for static assets (CloudFront or Cloudflare)
- Database query optimization with indexes
- Redis caching for frequently accessed data (trainer profiles, search results)

---

#### NFR-002: API Response Time
**Target**: <200ms for 95th percentile API requests
**Measurement**: Django Debug Toolbar, APM tool (New Relic or Sentry)
**Implementation**:
- Database indexing on foreign keys and location fields
- API response pagination (max 50 items per page)
- Eager loading with `select_related()` and `prefetch_related()`
- Cache API responses for 5 minutes (search results, trainer listings)

---

#### NFR-003: Concurrent Users
**Target**: Support 500 concurrent users at launch, 5000 within 6 months
**Measurement**: Load testing with Locust or JMeter
**Implementation**:
- Horizontal scaling with Gunicorn workers (4-8 workers per instance)
- Database connection pooling (pgBouncer)
- Async task processing with Celery (email sending, background checks)
- Auto-scaling EC2 instances or Kubernetes pods

---

### Security

#### NFR-004: Data Encryption
**Target**: All sensitive data encrypted at rest and in transit
**Implementation**:
- HTTPS only (TLS 1.3)
- PostgreSQL encryption at rest (AWS RDS encryption)
- Encrypt sensitive fields with Django's `Fernet` (SSN for background checks)
- Stripe handles all payment data (PCI compliant)

---

#### NFR-005: Authentication Security
**Target**: Prevent unauthorized access and account takeover
**Implementation**:
- Django's built-in password hashing (PBKDF2)
- Email verification required before account activation
- Rate limiting on login attempts (5 attempts per 15 minutes, then lockout)
- Password reset tokens expire after 24 hours
- Django CSRF protection enabled
- Optional 2FA with TOTP (Phase 3)

---

#### NFR-006: Data Privacy
**Target**: GDPR/CCPA compliance for user data
**Implementation**:
- Privacy policy and terms of service displayed during registration
- User data export feature (download all personal data as JSON)
- User data deletion request (anonymize or hard delete within 30 days)
- Cookie consent banner (for Google Analytics)
- Minimal data collection (only required fields)

---

### Scalability

#### NFR-007: Database Scalability
**Target**: Handle 100K users, 1M bookings within 2 years
**Implementation**:
- PostgreSQL 15+ with PostGIS extension
- Read replicas for search and analytics queries
- Partition bookings table by year (when >1M records)
- Archive old bookings to S3 (after 2 years)

---

#### NFR-008: File Storage Scalability
**Target**: Store 100K+ images without performance degradation
**Implementation**:
- AWS S3 for image and file storage (Phase 2)
- CloudFront CDN for fast image delivery
- Image compression on upload (max 1920px width, 80% quality)
- Thumbnails generated on upload (150x150, 300x300, 600x600)

---

### Reliability

#### NFR-009: Uptime
**Target**: 99.5% uptime (max 3.5 hours downtime per month)
**Measurement**: UptimeRobot or PingDom
**Implementation**:
- Health check endpoint: `/api/health/` (checks database, Redis, Celery)
- Load balancer with health checks (AWS ALB or Nginx)
- Database backups daily (automated snapshots)
- Monitoring with Sentry for error tracking

---

#### NFR-010: Error Handling
**Target**: Graceful degradation on errors, user-friendly error messages
**Implementation**:
- Global error boundary in React (display fallback UI on crash)
- Django exception middleware (log errors to Sentry, return 500 page)
- Validation errors show specific field errors (not generic "something went wrong")
- Retry logic for transient failures (Stripe API, email sending)

---

### Accessibility

#### NFR-011: WCAG 2.1 AA Compliance
**Target**: Accessible to users with disabilities
**Implementation**:
- Semantic HTML with proper heading hierarchy (h1, h2, h3)
- ARIA labels on interactive elements
- Keyboard navigation support (tab order, enter/space for buttons)
- Color contrast ratio ≥4.5:1 for text (use Tailwind's default colors)
- Alt text for all images
- Screen reader testing with NVDA or JAWS

---

### Compatibility

#### NFR-012: Browser Support
**Target**: Support latest 2 versions of major browsers
**Browsers**: Chrome, Firefox, Safari, Edge
**Mobile**: Safari iOS, Chrome Android
**Implementation**:
- Babel transpilation for ES6+ syntax
- CSS autoprefixer for vendor prefixes
- Test with BrowserStack or manual testing

---

#### NFR-013: Mobile Responsiveness
**Target**: Fully functional on mobile devices (375px width minimum)
**Implementation**:
- Mobile-first Tailwind CSS design
- Touch-friendly UI elements (min 44x44px tap targets)
- Responsive images with `srcset`
- Test on iPhone SE, iPhone 14, Pixel 7, Samsung Galaxy S23

---

## Technical Considerations

### Architecture Overview

**Architecture Pattern**: Monolithic with API-first design (migrate to microservices if needed)

**High-Level Architecture:**
```
┌─────────────────┐
│   React SPA     │  (Frontend: React 18 + Tailwind CSS)
│  (Port 3000)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Django API    │  (Backend: Django 5.0 + DRF)
│  (Port 8000)    │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ PostgreSQL│ │  Redis   │  (Cache + Celery broker)
│  + PostGIS│ │          │
└─────────┘ └──────────┘
     │
     ▼
┌──────────────┐
│ AWS S3 / Local│  (File storage)
└──────────────┘
```

**Request Flow Example (Search):**
1. User enters location in search bar
2. React calls `/api/v1/trainers/search?location=Chicago&radius=5`
3. Django view geocodes "Chicago" to lat/lng (cached)
4. PostGIS query: `SELECT * FROM trainers WHERE ST_DWithin(location, point, 5 miles)`
5. Results serialized and returned as JSON
6. React renders trainer cards + Google Map markers

---

### Technology Stack

#### Frontend
- **Framework**: React 18.2+ with React Router v6
- **Styling**: Tailwind CSS 3.0+
- **State Management**: React Query (TanStack Query) for server state, Context API for auth
- **Forms**: React Hook Form + Yup validation
- **Maps**: `@react-google-maps/api` for Google Maps integration
- **Calendar**: `react-big-calendar` or `@fullcalendar/react`
- **HTTP Client**: Axios with interceptors for auth tokens
- **Build Tool**: Vite (fast dev server, HMR)

#### Backend
- **Framework**: Django 5.0 + Django REST Framework 3.14+
- **Authentication**: Django's built-in auth + JWT tokens (SimpleJWT)
- **Database ORM**: Django ORM with PostGIS support
- **Task Queue**: Celery 5.3+ with Redis broker
- **Email**: Django email backend (SMTP or SendGrid)
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)

#### Database
- **Primary DB**: PostgreSQL 15+ with PostGIS 3.3+
- **Cache**: Redis 7.0+ (caching, Celery broker, session storage)

#### Third-Party Services
- **Payments**: Stripe (Connect for marketplace payments)
- **Maps**: Google Maps (Places API, Geocoding API, Maps JavaScript API)
- **Background Checks**: Checkr API (Phase 3)
- **Email**: SendGrid or AWS SES (Phase 2)
- **File Storage**: AWS S3 + CloudFront (Phase 2, local storage for MVP)
- **Monitoring**: Sentry (error tracking), Google Analytics

#### DevOps
- **Hosting**: AWS EC2 or Heroku (MVP), AWS ECS/EKS (production)
- **CI/CD**: GitHub Actions
- **Version Control**: Git + GitHub
- **Environment Management**: Docker (development), docker-compose

---

### API Specifications

**Base URL**: `https://api.fitconnect.com/v1/`

**Authentication**: JWT tokens in `Authorization: Bearer <token>` header

**Common Response Codes:**
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid auth token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., double-booking)
- `500 Internal Server Error`: Server error

**Pagination Format:**
```json
{
  "count": 100,
  "next": "https://api.fitconnect.com/v1/trainers/?page=3",
  "previous": "https://api.fitconnect.com/v1/trainers/?page=1",
  "results": [...]
}
```

**Error Response Format:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "email": ["This field is required."],
    "password": ["Password must be at least 8 characters."]
  }
}
```

---

### Database Schema

**Key Models:**

```python
# users/models.py
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('trainer', 'Trainer'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    email_verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True)

class Specialization(models.Model):
    name = models.CharField(max_length=50, unique=True)  # e.g., "Yoga", "HIIT"
    slug = models.SlugField(unique=True)

class TrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500)
    specializations = models.ManyToManyField(Specialization)
    address = models.CharField(max_length=255)
    location = gis_models.PointField(geography=True)  # PostGIS
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    years_experience = models.IntegerField(default=0)
    verified = models.BooleanField(default=False)
    verification_expires = models.DateField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='trainers/photos/')
    slug = models.SlugField(unique=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            gis_models.Index(fields=['location']),
            models.Index(fields=['verified', 'average_rating']),
        ]

class TrainerPhoto(models.Model):
    trainer = models.ForeignKey(TrainerProfile, related_name='photos', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='trainers/photos/')
    caption = models.CharField(max_length=100, blank=True)
    order = models.IntegerField(default=0)

class AvailabilitySlot(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('blocked', 'Blocked'),
    ]
    trainer = models.ForeignKey(TrainerProfile, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')

    class Meta:
        unique_together = ['trainer', 'start_time']
        indexes = [
            models.Index(fields=['trainer', 'start_time', 'status']),
        ]

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    SESSION_TYPE_CHOICES = [
        ('one_on_one', '1-on-1'),
        ('small_group', 'Small Group'),
    ]
    client = models.ForeignKey(User, related_name='bookings', on_delete=models.CASCADE)
    trainer = models.ForeignKey(TrainerProfile, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    special_requests = models.TextField(max_length=500, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2)
    confirmation_code = models.CharField(max_length=10, unique=True)
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['client', 'start_time']),
            models.Index(fields=['trainer', 'start_time']),
            models.Index(fields=['status', 'start_time']),
        ]

class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    client = models.ForeignKey(User, on_delete=models.CASCADE)
    trainer = models.ForeignKey(TrainerProfile, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    review_text = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['booking', 'client']
```

---

### Deployment Strategy

**MVP (Phase 1-2):**
- **Frontend**: Vercel or Netlify (static hosting for React build)
- **Backend**: Heroku (single dyno) or AWS EC2 t3.medium instance
- **Database**: Heroku Postgres or AWS RDS PostgreSQL (db.t3.micro)
- **File Storage**: Local file system (Django MEDIA_ROOT)
- **Cost Estimate**: ~$50-100/month

**Production (Phase 3+):**
- **Frontend**: AWS CloudFront + S3 (CDN + static hosting)
- **Backend**: AWS ECS with Fargate (2 containers behind ALB)
- **Database**: AWS RDS PostgreSQL Multi-AZ (db.t3.medium)
- **Cache**: AWS ElastiCache Redis (cache.t3.micro)
- **File Storage**: AWS S3 + CloudFront
- **Cost Estimate**: ~$300-500/month for 10K MAU

**CI/CD Pipeline:**
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    - Run tests (pytest, jest)
    - Build frontend (npm run build)
    - Build Docker image
    - Push to ECR
    - Update ECS service
    - Run database migrations
```

---

### Migration Strategy

**Not applicable** (greenfield project)

---

### Testing Strategy

**Unit Tests:**
- **Backend**: pytest-django for Django models, views, serializers
  - Target: 80%+ code coverage
  - Mock external APIs (Stripe, Google Maps)
- **Frontend**: Jest + React Testing Library for components
  - Test user interactions (form submissions, clicks)
  - Test API integration with MSW (Mock Service Worker)

**Integration Tests:**
- Test full user flows: registration → search → booking → payment
- Use Django's TestCase with test database
- Test API endpoints with Django REST Framework's APIClient

**End-to-End Tests:**
- Playwright or Cypress for critical user flows
- Test on staging environment before production deploy
- Flows to test:
  1. New user registration and email verification
  2. Trainer profile creation and publishing
  3. Client searches, views profile, and books session
  4. Payment flow with Stripe test cards

**Performance Tests:**
- Locust for load testing (simulate 500 concurrent users)
- Test API response times under load
- Identify bottlenecks before launch

**Manual Testing:**
- Browser compatibility testing (Chrome, Safari, Firefox, Edge)
- Mobile responsiveness testing (iOS Safari, Chrome Android)
- Accessibility testing with screen reader (NVDA)

---

## Implementation Roadmap

### Phase 1: MVP - Core Matching & Booking (Weeks 1-4)

**Goal**: Launch functional marketplace where clients can search trainers and book sessions (no payment yet)

**Sprint 1 (Week 1): Foundation**
- TASK-001: Project setup (Django + React + PostgreSQL + PostGIS) - 6 hours
- TASK-002: User authentication system (registration, login, email verification) - 8 hours
- TASK-003: User models and role-based access (Client, Trainer, Admin) - 4 hours
- TASK-004: Basic frontend layout and navigation - 6 hours
- **Deliverable**: Users can register, login, and access role-specific dashboards

**Sprint 2 (Week 2): Trainer Profiles**
- TASK-005: Trainer profile models (bio, specializations, location) - 4 hours
- TASK-006: Profile creation form with photo uploads - 8 hours
- TASK-007: Google Geocoding API integration for address → lat/lng - 3 hours
- TASK-008: Trainer profile public view page - 5 hours
- **Deliverable**: Trainers can create and publish profiles with photos and location

**Sprint 3 (Week 2-3): Location-Based Search**
- TASK-009: PostGIS setup and location queries - 4 hours
- TASK-010: Search API endpoint with radius filter - 6 hours
- TASK-011: Search UI with filters (specialization, price, distance) - 8 hours
- TASK-012: Google Maps integration with trainer markers - 6 hours
- **Deliverable**: Clients can search for trainers by location and view on map

**Sprint 4 (Week 3): Availability Calendar**
- TASK-013: Availability slot models and database design - 4 hours
- TASK-014: Calendar UI component (react-big-calendar) - 6 hours
- TASK-015: Trainer availability management (set recurring, block dates) - 8 hours
- TASK-016: Display availability on trainer profile for clients - 4 hours
- **Deliverable**: Trainers set availability; clients see available time slots

**Sprint 5 (Week 4): Booking System**
- TASK-017: Booking models and API endpoints - 6 hours
- TASK-018: Booking form UI (date/time picker, session details) - 6 hours
- TASK-019: Booking transaction logic with double-booking prevention - 6 hours
- TASK-020: Email notifications (booking confirmation) - 4 hours
- TASK-021: Client and trainer dashboards showing bookings - 6 hours
- **Deliverable**: Full booking flow works; bookings in "pending" status (payment Phase 2)

**Phase 1 Validation Checkpoint:**
- [ ] Trainer can create profile with 3+ photos
- [ ] Client can search trainers within 5 miles of location
- [ ] Map displays trainers with correct pins
- [ ] Booking prevents double-booking (database constraint)
- [ ] Confirmation emails sent within 30 seconds

**Phase 1 Task Summary**: 21 tasks, ~98 hours (~3-4 weeks with 1 developer)

---

### Phase 2: Payments & Reviews (Weeks 5-8)

**Goal**: Enable payments via Stripe and add review system for quality assurance

**Sprint 6 (Week 5): Stripe Integration**
- TASK-022: Set up Stripe Connect for marketplace payments - 8 hours
- TASK-023: Payment intent API and frontend integration - 8 hours
- TASK-024: Booking status update to "confirmed" after payment - 4 hours
- TASK-025: Stripe webhook handling (payment success, failure) - 6 hours
- **Deliverable**: Clients can pay for bookings; trainers receive payouts

**Sprint 7 (Week 6): Payment Features**
- TASK-026: Saved payment methods (store Stripe customer IDs) - 4 hours
- TASK-027: Refund logic based on cancellation policy - 6 hours
- TASK-028: Payment receipt emails - 3 hours
- TASK-029: Trainer earnings dashboard - 6 hours
- **Deliverable**: Full payment flow with refunds and earnings tracking

**Sprint 8 (Week 7): Review System**
- TASK-030: Review models and API endpoints - 4 hours
- TASK-031: Review submission form (star rating, text) - 5 hours
- TASK-032: Display reviews on trainer profile - 4 hours
- TASK-033: Average rating calculation and caching - 3 hours
- TASK-034: Review reminder email 24 hours post-session - 3 hours
- **Deliverable**: Clients can leave reviews; ratings displayed on profiles

**Sprint 9 (Week 8): Messaging & Polish**
- TASK-035: In-app messaging system (Django Channels or polling) - 10 hours
- TASK-036: Message UI and notifications - 6 hours
- TASK-037: AWS S3 file storage migration - 4 hours
- TASK-038: Performance optimization (caching, query optimization) - 6 hours
- **Deliverable**: Messaging works; platform ready for beta launch

**Phase 2 Validation Checkpoint:**
- [ ] Payment flow completes with Stripe test card
- [ ] Refunds issued correctly based on cancellation time
- [ ] Reviews appear on trainer profile within 1 second of submission
- [ ] Messages sent and received in real-time (or <10 second polling)
- [ ] Average rating updates immediately after new review

**Phase 2 Task Summary**: 17 tasks, ~80 hours (~4 weeks with 1 developer)

---

### Phase 3: Advanced Features & Launch (Weeks 9-12)

**Goal**: Add admin tools, analytics, background checks, and prepare for public launch

**Sprint 10 (Week 9): Admin Dashboard**
- TASK-039: Admin analytics dashboard (users, bookings, revenue) - 8 hours
- TASK-040: User management admin views (suspend, edit) - 5 hours
- TASK-041: Booking oversight and dispute resolution - 4 hours
- TASK-042: Audit log for admin actions - 3 hours
- **Deliverable**: Admin can monitor platform health and manage users

**Sprint 11 (Week 10): Background Checks**
- TASK-043: Checkr API integration - 6 hours
- TASK-044: Trainer verification flow UI - 4 hours
- TASK-045: Verification badge on profiles - 2 hours
- TASK-046: Verification expiry reminders (Celery beat) - 3 hours
- **Deliverable**: Trainers can get verified; badge displayed on profiles

**Sprint 12 (Week 11): Advanced Search & Features**
- TASK-047: Advanced search filters (gender, language, location type) - 5 hours
- TASK-048: Saved searches and favorite trainers - 4 hours
- TASK-049: Google Analytics integration - 2 hours
- TASK-050: SEO optimization (meta tags, sitemap) - 4 hours
- **Deliverable**: Enhanced discovery features and analytics tracking

**Sprint 13 (Week 12): Launch Preparation**
- TASK-051: End-to-end testing (Playwright test suite) - 8 hours
- TASK-052: Performance testing (Locust load tests) - 4 hours
- TASK-053: Security audit (OWASP top 10 checklist) - 4 hours
- TASK-054: Deployment to production environment - 6 hours
- TASK-055: Marketing landing page and blog - 6 hours
- **Deliverable**: Production launch with monitoring and marketing site

**Phase 3 Validation Checkpoint:**
- [ ] Admin dashboard loads in <1 second
- [ ] Background check completes and updates verification status
- [ ] Platform handles 500 concurrent users (load test)
- [ ] All Playwright E2E tests pass
- [ ] OWASP security checklist completed

**Phase 3 Task Summary**: 17 tasks, ~68 hours (~4 weeks with 1 developer)

---

### Complete Task Breakdown Summary

**Total Implementation Effort:**
- **Phase 1**: 21 tasks, ~98 hours (4 weeks)
- **Phase 2**: 17 tasks, ~80 hours (4 weeks)
- **Phase 3**: 17 tasks, ~68 hours (4 weeks)
- **Grand Total**: 55 tasks, ~246 hours (~12 weeks with 1 full-time developer)

**Critical Path:**
```
TASK-001 (Setup) → TASK-002 (Auth) → TASK-005 (Trainer Models) →
TASK-010 (Search API) → TASK-015 (Availability) → TASK-019 (Booking Logic) →
TASK-023 (Stripe Payment) → TASK-031 (Reviews) → TASK-054 (Production Deploy)
```

**Parallelizable Work:**
- Frontend and backend tasks can be split between 2 developers
- Phase 1 search (TASK-009-012) can be built while Phase 1 booking (TASK-017-021) is designed
- Phase 2 payment (TASK-022-029) and reviews (TASK-030-034) are independent

---

## Out of Scope

The following features are explicitly **NOT included** in the initial launch and will be considered for future iterations:

### Excluded for MVP (Future Consideration)

1. **Mobile Native Apps**
   - iOS and Android apps (mobile web only for launch)
   - Push notifications (email only for now)

2. **Video/Virtual Training**
   - Live video session support (Zoom/Google Meet integration)
   - Recorded workout libraries

3. **Social Features**
   - User profiles with social connections
   - Activity feed or news feed
   - Following trainers for updates

4. **Advanced Matching Algorithm**
   - AI/ML-based trainer recommendations
   - Personality matching or compatibility scores

5. **Multi-Currency Support**
   - International payments (USD only for Phase 1)
   - Currency conversion

6. **Group Classes**
   - Large group classes (>5 people)
   - Class schedules vs. 1-on-1 bookings

7. **Subscription Plans**
   - Monthly memberships for unlimited sessions
   - Trainer subscription tiers

8. **Loyalty/Rewards Program**
   - Points for bookings
   - Referral bonuses

9. **Corporate Accounts**
   - Enterprise wellness program integration
   - Bulk booking for companies

10. **Advanced Analytics for Trainers**
    - Client progress tracking
    - Workout history and metrics

---

## Open Questions & Risks

### Open Questions

#### Q1: Session Cancellation Policy
**Question**: What is the exact cancellation and refund policy?
**Current Assumption**: Full refund if cancelled >24 hours, 50% if 12-24 hours, no refund <12 hours
**Decision Needed By**: Week 5 (before Stripe integration)
**Owner**: Product Manager / Founder
**Impact**: Medium (affects booking terms and Stripe refund logic)

---

#### Q2: Platform Commission Rate
**Question**: What percentage commission does the platform take from bookings?
**Current Assumption**: 15% of booking total
**Decision Needed By**: Week 5 (before payment implementation)
**Owner**: Business / Finance
**Impact**: High (affects pricing model and trainer acquisition)

---

#### Q3: Background Check Provider
**Question**: Should we use Checkr or alternative provider (Sterling, Accurate)?
**Current Assumption**: Checkr (most developer-friendly API)
**Decision Needed By**: Week 9 (Phase 3 start)
**Owner**: Legal / Compliance
**Impact**: Medium (affects integration complexity and cost)

---

#### Q4: Minimum Booking Notice
**Question**: What's the minimum advance notice for bookings (e.g., 2 hours, 24 hours)?
**Current Assumption**: 2 hours
**Decision Needed By**: Week 4 (before booking implementation)
**Owner**: Product Manager
**Impact**: Low (configuration change, easy to adjust)

---

#### Q5: Trainer Verification Requirements
**Question**: Should trainers submit proof of certifications during registration or later?
**Current Assumption**: Optional for MVP, required for verification badge in Phase 3
**Decision Needed By**: Week 2 (trainer profile creation)
**Owner**: Product Manager
**Impact**: Medium (affects onboarding friction and quality)

---

#### Q6: Messaging Privacy
**Question**: Should messaging be end-to-end encrypted or stored in plaintext?
**Current Assumption**: Stored in database (not E2E encrypted) for moderation
**Decision Needed By**: Week 7 (before messaging implementation)
**Owner**: Legal / Security
**Impact**: Medium (affects architecture complexity and compliance)

---

### Risks

#### RISK-001: Google Maps API Costs
**Risk**: High usage of Google Maps APIs (Geocoding, Places, Maps JavaScript) could exceed free tier
**Likelihood**: Medium
**Impact**: High (could cost $500-2000/month with scale)
**Mitigation**:
- Cache geocoding results indefinitely (addresses rarely change)
- Limit map loads (only show map on search results, not every profile view)
- Consider Mapbox as lower-cost alternative
- Set up billing alerts at $100, $500 thresholds

---

#### RISK-002: Stripe Connect Onboarding Friction
**Risk**: Trainers may abandon registration due to complex Stripe Connect onboarding (SSN, bank account required)
**Likelihood**: Medium
**Impact**: High (reduces trainer supply)
**Mitigation**:
- Allow trainers to complete profile before Stripe onboarding
- Show clear value proposition before asking for financial info
- Provide support chat during onboarding
- Monitor drop-off rates at Stripe Connect step

---

#### RISK-003: Double-Booking Race Condition
**Risk**: High concurrency could cause two clients to book same time slot simultaneously
**Likelihood**: Low (unlikely with hundreds of users)
**Impact**: High (poor user experience, refunds required)
**Mitigation**:
- Use database row-level locking (`select_for_update()`)
- Atomic transactions for booking creation
- Write integration tests for concurrent booking attempts
- Monitor for double-bookings in production

---

#### RISK-004: Low Initial Trainer Supply
**Risk**: Insufficient trainers in key cities leads to poor client experience (no search results)
**Likelihood**: High (cold start problem for marketplaces)
**Impact**: High (clients churn, negative reviews)
**Mitigation**:
- Pre-launch trainer recruitment campaign (target 50 trainers in top 5 cities)
- Launch in 2-3 cities only (not nationwide) to concentrate supply
- Offer incentives for early trainer signups (free verification, reduced commission)
- Manual outreach to gyms and training studios

---

#### RISK-005: Scalability with PostGIS
**Risk**: Location-based queries may slow down with 10K+ trainers
**Likelihood**: Low (PostGIS is highly optimized)
**Impact**: Medium (search slowdown)
**Mitigation**:
- Create indexes on `location` geography column
- Cache search results for popular locations (Redis)
- Paginate results (max 50 per page)
- Stress test with 50K dummy trainer records

---

#### RISK-006: GDPR/CCPA Compliance
**Risk**: User data handling may not comply with privacy regulations
**Likelihood**: Medium (complex regulations)
**Impact**: High (fines, legal issues)
**Mitigation**:
- Implement data export and deletion features (Phase 2)
- Privacy policy reviewed by lawyer before launch
- Cookie consent banner for analytics
- Avoid collecting unnecessary data (GDPR principle of data minimization)

---

#### RISK-007: Email Deliverability
**Risk**: Confirmation and notification emails land in spam folder
**Likelihood**: Medium (common issue)
**Impact**: Medium (users miss bookings)
**Mitigation**:
- Use reputable email service (SendGrid, AWS SES)
- Set up SPF, DKIM, DMARC records for domain
- Monitor email bounce and spam complaint rates
- Test with Gmail, Outlook, Yahoo during development

---

## Validation Checkpoints

### Checkpoint 1: End of Phase 1 (Week 4)
**Goal**: Validate core marketplace functionality before investing in payments

**Validation Criteria:**
- [ ] 5 test trainers have created complete profiles
- [ ] 10 test clients successfully searched and found trainers
- [ ] 20 test bookings created with no double-bookings
- [ ] All confirmation emails delivered within 30 seconds
- [ ] Search completes in <2 seconds for 95th percentile
- [ ] Mobile responsiveness tested on 3 devices (iPhone, Pixel, tablet)

**Go/No-Go Decision**:
- **Go to Phase 2** if: All criteria met, no critical bugs, positive feedback from test users
- **Pause to fix** if: Double-booking occurs, search is slow (>3 seconds), or major UX issues reported

---

### Checkpoint 2: End of Phase 2 (Week 8)
**Goal**: Validate payment flow and readiness for private beta launch

**Validation Criteria:**
- [ ] 10 test payments completed successfully with Stripe test cards
- [ ] Refund logic tested for all cancellation scenarios (>24h, 12-24h, <12h)
- [ ] 5 reviews submitted and displayed on trainer profiles
- [ ] Average rating calculates correctly after each new review
- [ ] Messaging works between clients and trainers (messages delivered <10 seconds)
- [ ] AWS S3 file uploads working (if migrated from local storage)
- [ ] No payment security vulnerabilities (basic security audit)

**Go/No-Go Decision**:
- **Go to Private Beta** if: All criteria met, load test passes (100 concurrent users), Stripe integration stable
- **Pause to fix** if: Payment failures >5%, security vulnerabilities found, or messaging broken

---

### Checkpoint 3: End of Phase 3 (Week 12)
**Goal**: Validate platform readiness for public launch

**Validation Criteria:**
- [ ] Admin dashboard shows accurate analytics (users, bookings, revenue)
- [ ] Background check integration tested with 3 trainers
- [ ] Load test passes with 500 concurrent users (response times <500ms)
- [ ] All Playwright E2E tests pass (registration, search, booking, payment, review)
- [ ] OWASP security checklist completed (top 10 vulnerabilities addressed)
- [ ] Production deployment successful with zero downtime
- [ ] Monitoring and alerting set up (Sentry, UptimeRobot)
- [ ] Marketing landing page live with email capture form

**Go/No-Go Decision**:
- **Go to Public Launch** if: All criteria met, private beta feedback positive (NPS >40), no critical bugs
- **Delay launch** if: Load test fails, security issues found, or beta users report major issues

---

## Appendix: Task Breakdown Hints

See `.taskmaster/tasks/` directory for detailed, actionable sub-tasks for each TASK-XXX mentioned in this PRD.

Each task file includes:
- Sub-task checklist (15-minute increments)
- Implementation guide with code examples
- Acceptance criteria (testable)
- Test cases

**Example**: `.taskmaster/tasks/TASK-001-setup-project.md` contains step-by-step instructions for Django + React + PostgreSQL setup with all commands and configuration files.

---

## Document Version History

- **v1.0** (2025-11-06): Initial PRD created for FitConnect marketplace MVP
- **Author**: Claude Code (prd-taskmaster skill)
- **Reviewers**: TBD
- **Next Review Date**: Week 2 (after Sprint 2 completion)

---

**End of PRD**
