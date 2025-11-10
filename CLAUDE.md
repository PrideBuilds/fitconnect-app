# FitConnect - Claude Code Development Guide

## Project Overview

**FitConnect** is a peer-to-peer marketplace connecting travelers with personal trainers and gyms across the United States. Like Airbnb for fitness, it enables seamless discovery, booking, and payment for training sessions in any city.

**Tech Stack:**
- **Frontend**: React 18+ with Tailwind CSS, React Router, React Query
- **Backend**: Python 3.11+ with Django 5.0, Django REST Framework
- **Database**: PostgreSQL 15+ with PostGIS extension (geospatial queries)
- **Third-Party**: Stripe (payments), Google Maps (location), SendGrid (email)
- **DevOps**: Docker, AWS (S3, RDS, EC2), GitHub Actions

**Key Architecture:**
- Monolithic API-first design (React SPA + Django REST API)
- PostGIS for location-based trainer search with radius queries
- JWT authentication with role-based access (Client, Trainer, Admin)
- Celery for async tasks (email notifications, background checks)
- Redis for caching and Celery broker

**Project Structure:**
```
fitconnect/
├── frontend/          # React + Tailwind SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/       # Axios API client
│   │   └── utils/
│   └── package.json
├── backend/           # Django + DRF API
│   ├── fitconnect/    # Project settings
│   ├── users/         # User auth and profiles
│   ├── trainers/      # Trainer profiles and search
│   ├── bookings/      # Booking system
│   ├── payments/      # Stripe integration
│   └── manage.py
├── .taskmaster/       # Taskmaster PRD and task files
│   ├── docs/
│   │   └── prd.md     # Comprehensive PRD
│   └── tasks/         # Expanded task files (TASK-001-*.md)
└── README.md
```

---

## Development Workflow: Test-Driven Development (TDD)

**CRITICAL**: Always follow TDD approach unless explicitly instructed otherwise.

### TDD Cycle for Every Feature

1. **Write Tests First**
   - Backend: Write pytest tests before implementing Django views/models
   - Frontend: Write Jest + React Testing Library tests before components
   - Tests should FAIL initially (red phase)

2. **Implement Minimum Code**
   - Write the simplest code to make tests pass (green phase)
   - Focus on functionality, not perfection

3. **Refactor**
   - Clean up code while keeping tests passing
   - Improve structure, remove duplication

4. **Validate with Blind-Validator Agent**
   - Before marking task complete, use agent to verify implementation
   - Agent checks: tests pass, code quality, security, edge cases

### Example TDD Flow

```bash
# 1. Write failing test
# backend/trainers/tests/test_search.py
def test_search_trainers_by_location():
    # Test that searching by location returns trainers within radius
    response = client.get('/api/v1/trainers/search?lat=37.7749&lng=-122.4194&radius=5')
    assert response.status_code == 200
    assert len(response.data['results']) > 0

# 2. Run test (should fail)
pytest trainers/tests/test_search.py  # ❌ FAIL

# 3. Implement feature
# backend/trainers/views.py
class TrainerSearchView(APIView):
    def get(self, request):
        # Implementation...
        return Response(...)

# 4. Run test (should pass)
pytest trainers/tests/test_search.py  # ✅ PASS

# 5. Refactor and validate with agent (see below)
```

---

## Agent Usage: Validation and Quality Assurance

### 1. Blind-Validator Agent (MANDATORY)

**When to Use**: Before marking ANY task as complete

**Purpose**: Validates that implementation meets requirements without seeing your code first (unbiased review)

**How to Use**:
```
I've completed TASK-010 (Search API with geospatial queries).
Please use the blind-validator agent to verify:
1. All tests pass (pytest for backend)
2. API endpoint returns correct results
3. PostGIS queries are optimized
4. Edge cases handled (no results, invalid radius)
5. Code follows Django best practices
```

**Agent Will Check**:
- ✅ All tests pass (unit, integration)
- ✅ Acceptance criteria from task file met
- ✅ Code quality (linting, type hints, docstrings)
- ✅ Security (SQL injection, XSS, authentication)
- ✅ Performance (N+1 queries, missing indexes)
- ✅ Edge cases (empty results, invalid inputs)

**DO NOT** mark task complete until agent approves or you fix issues found.

---

### 2. Explore Agent

**When to Use**: When you need to understand codebase structure or find related code

**Purpose**: Fast exploration of codebase to gather context before implementation

**How to Use**:
```
Use the Explore agent (thoroughness: medium) to find:
- Existing authentication patterns in the codebase
- How other API endpoints are structured
- Where file uploads are handled
```

**Thoroughness Levels**:
- **quick**: Basic file/directory search (1-2 minutes)
- **medium**: Moderate search across multiple files (3-5 minutes)
- **very thorough**: Comprehensive analysis (5-10 minutes)

---

## Taskmaster Workflow

### Task File Structure

All tasks are in `.taskmaster/tasks/TASK-XXX-*.md` with:
- **Sub-tasks**: Checkbox list of actionable items (<1 hour each)
- **Implementation Guide**: Step-by-step with code examples
- **Acceptance Criteria**: Testable conditions for completion
- **Test Cases**: Specific tests to write

### Task Execution Best Practices

#### 1. Read Task File First
```bash
# Before starting TASK-010, read the task file
cat .taskmaster/tasks/TASK-010-search-api.md
```

#### 2. Follow TDD Approach
- Write tests from "Test Cases" section first
- Implement code following "Implementation Guide"
- Check off sub-tasks as you complete them

#### 3. Parallel Task Execution

**When possible, run independent tasks in parallel:**

```
I'm starting Sprint 3. These tasks are independent:
- TASK-009: PostGIS setup (backend)
- TASK-011: Search UI (frontend)
- TASK-012: Google Maps integration (frontend)

Let's execute TASK-009 sequentially (database setup required first),
then TASK-011 and TASK-012 in parallel (both frontend, no dependencies).
```

**How to Identify Parallelizable Tasks**:
- Check "Dependencies" in task file header
- Backend vs. Frontend tasks can often run in parallel
- UI components that don't share state can be built concurrently

#### 4. Use Agents for Validation

**After each task**:
```
Completed TASK-015 (Availability Calendar).
Run blind-validator agent to verify:
- React Big Calendar integrated correctly
- API endpoints return correct availability slots
- Double-booking prevention works
- All sub-tasks in TASK-015-availability-calendar.md completed
```

#### 5. Update Task Status

Mark sub-tasks complete in task file:
```markdown
## Sub-Tasks
- [x] 1. Install react-big-calendar package
- [x] 2. Create AvailabilitySlot model in Django
- [x] 3. Build calendar UI component
- [ ] 4. Implement drag-to-select interaction  ← Currently working on this
```

---

## Quality Gates: Never Skip These

### Before Committing Code

1. **All Tests Pass**
   ```bash
   # Backend
   pytest

   # Frontend
   npm test
   ```

2. **Linting Passes**
   ```bash
   # Backend
   flake8 backend/
   black backend/ --check
   mypy backend/

   # Frontend
   npm run lint
   ```

3. **Type Checking (if applicable)**
   ```bash
   # Backend
   mypy backend/

   # Frontend
   npm run type-check  # if using TypeScript
   ```

### Before Marking Task Complete

1. **Blind-Validator Agent Approval**
   - Agent must review and approve implementation
   - Fix any issues found before proceeding

2. **Acceptance Criteria Met**
   - Check ALL criteria in task file
   - Manually test critical user flows

3. **Edge Cases Tested**
   - Empty states (no results, no data)
   - Error states (network failure, invalid input)
   - Boundary conditions (max length, min value)

### Before Deploying to Staging/Production

1. **Integration Tests Pass**
   ```bash
   pytest --integration
   ```

2. **E2E Tests Pass** (Playwright/Cypress)
   ```bash
   npm run test:e2e
   ```

3. **Security Checklist Reviewed**
   - OWASP Top 10 vulnerabilities checked
   - Secrets not committed to git
   - API authentication required on protected endpoints

---

## Common Patterns and Conventions

### Django Backend

**API Endpoint Naming**:
```
GET    /api/v1/trainers/           # List trainers
GET    /api/v1/trainers/{id}/      # Retrieve trainer
POST   /api/v1/trainers/           # Create trainer
PATCH  /api/v1/trainers/{id}/      # Update trainer
DELETE /api/v1/trainers/{id}/      # Delete trainer

POST   /api/v1/trainers/search/    # Custom action (search)
```

**Model Conventions**:
- Use UUIDs for primary keys (security, non-enumerable)
- Always include `created_at` and `updated_at` timestamps
- Use `models.Index` for frequently queried fields

**View Conventions**:
- Use Django REST Framework ViewSets or APIView
- Always validate input with serializers
- Return proper HTTP status codes (200, 201, 400, 404, etc.)

**Test Conventions**:
- File: `tests/test_<feature>.py`
- Class: `Test<FeatureName>`
- Method: `test_<scenario>`
- Use pytest fixtures for common setup

### React Frontend

**Component Structure**:
```jsx
// components/TrainerCard/TrainerCard.jsx
import React from 'react';
import PropTypes from 'prop-types';

const TrainerCard = ({ trainer, onBook }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Component content */}
    </div>
  );
};

TrainerCard.propTypes = {
  trainer: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    // ...
  }).isRequired,
  onBook: PropTypes.func.isRequired,
};

export default TrainerCard;
```

**Tailwind CSS Conventions**:
- Use Tailwind utility classes (not custom CSS)
- Follow mobile-first responsive design (sm:, md:, lg:, xl:)
- Extract repeated patterns to components (not @apply in CSS)

**API Client Pattern**:
```javascript
// api/trainers.js
import axios from './axios-instance';

export const searchTrainers = async (location, radius) => {
  const response = await axios.get('/api/v1/trainers/search', {
    params: { location, radius }
  });
  return response.data;
};
```

**Test Conventions**:
- File: `<ComponentName>.test.jsx`
- Use React Testing Library (not Enzyme)
- Test user interactions, not implementation details

---

## Testing Strategy

### Unit Tests (80%+ coverage goal)

**Backend (pytest)**:
```python
# backend/trainers/tests/test_models.py
import pytest
from trainers.models import TrainerProfile

@pytest.mark.django_db
def test_trainer_profile_creation():
    """Test that trainer profile is created with correct fields"""
    trainer = TrainerProfile.objects.create(
        user=user,
        bio="Experienced trainer",
        hourly_rate=75.00,
        # ...
    )
    assert trainer.bio == "Experienced trainer"
    assert trainer.hourly_rate == 75.00
```

**Frontend (Jest + RTL)**:
```javascript
// components/TrainerCard/TrainerCard.test.jsx
import { render, screen } from '@testing-library/react';
import TrainerCard from './TrainerCard';

test('renders trainer name and rate', () => {
  const trainer = {
    id: '123',
    name: 'Jane Doe',
    hourly_rate: 75,
  };

  render(<TrainerCard trainer={trainer} onBook={() => {}} />);

  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('$75/hour')).toBeInTheDocument();
});
```

### Integration Tests

**API Integration**:
```python
# backend/bookings/tests/test_booking_api.py
@pytest.mark.django_db
def test_booking_creation_flow():
    """Test full booking flow from search to confirmation"""
    # 1. Search for trainers
    response = client.get('/api/v1/trainers/search?location=Chicago&radius=5')
    trainer_id = response.data['results'][0]['id']

    # 2. Get availability
    response = client.get(f'/api/v1/trainers/{trainer_id}/availability')
    slot = response.data['slots'][0]

    # 3. Create booking
    response = client.post('/api/v1/bookings/', {
        'trainer_id': trainer_id,
        'start_time': slot['start_time'],
        'duration_minutes': 60,
    })
    assert response.status_code == 201
    assert response.data['status'] == 'pending'
```

### End-to-End Tests (Playwright)

```javascript
// e2e/booking-flow.spec.js
import { test, expect } from '@playwright/test';

test('complete booking flow', async ({ page }) => {
  // 1. Search for trainers
  await page.goto('http://localhost:3000');
  await page.fill('[data-testid="search-input"]', 'Chicago, IL');
  await page.click('[data-testid="search-button"]');

  // 2. Select trainer
  await page.click('[data-testid="trainer-card"]:first-child');

  // 3. Book session
  await page.click('[data-testid="available-slot"]:first-child');
  await page.fill('[data-testid="special-requests"]', 'Focus on core strength');
  await page.click('[data-testid="confirm-booking"]');

  // 4. Verify confirmation
  await expect(page.locator('[data-testid="confirmation"]')).toBeVisible();
});
```

---

## Environment Setup Commands

### First-Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd fitconnect

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Database setup (PostgreSQL with PostGIS)
createdb fitconnect
psql fitconnect -c "CREATE EXTENSION postgis;"
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser

# 5. Frontend setup
cd ../frontend
npm install

# 6. Environment variables
cp .env.example .env
# Edit .env with API keys (Google Maps, Stripe, etc.)
```

### Daily Development

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Celery (for async tasks)
cd backend
celery -A fitconnect worker -l info

# Terminal 4: Redis (if not running as service)
redis-server
```

### Running Tests

```bash
# Backend tests
cd backend
pytest                      # All tests
pytest -v                   # Verbose
pytest --cov                # With coverage
pytest trainers/tests/      # Specific app

# Frontend tests
cd frontend
npm test                    # All tests
npm test -- --coverage      # With coverage
npm test TrainerCard        # Specific component

# E2E tests
cd frontend
npm run test:e2e            # All E2E tests
npm run test:e2e -- --ui    # With Playwright UI
```

---

## Debugging Tips

### Django Debugging

**Django Shell**:
```bash
python manage.py shell
>>> from trainers.models import TrainerProfile
>>> trainers = TrainerProfile.objects.all()
>>> trainers.count()
```

**Django Debug Toolbar**:
- Install: `pip install django-debug-toolbar`
- Shows SQL queries, request/response timing
- Helps identify N+1 query problems

**Print SQL Queries**:
```python
from django.db import connection
print(connection.queries)  # See all SQL queries executed
```

### React Debugging

**React DevTools**:
- Install browser extension
- Inspect component props and state
- Profile component render performance

**Console Logging**:
```javascript
console.log('Trainer data:', trainer);
console.table(trainers);  // Nice table format for arrays
```

**API Response Debugging**:
```javascript
// Add to axios interceptor
axios.interceptors.response.use(
  response => {
    console.log('API Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error.response);
    return Promise.reject(error);
  }
);
```

---

## Git Workflow

### Branch Naming
```
feature/TASK-010-search-api
bugfix/TASK-015-calendar-double-booking
hotfix/payment-error-handling
```

### Commit Messages
```
feat(trainers): Add location-based search API (TASK-010)

- Implement PostGIS radius query
- Add specialization and price filters
- Return paginated results with distance
- Tests: 95% coverage on search endpoint

Closes TASK-010
```

**Commit Message Format**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance

### Pull Request Template
```markdown
## Description
Brief description of changes.

## Task
TASK-010: Location-based trainer search

## Changes
- Added TrainerSearchView API endpoint
- Implemented PostGIS geospatial queries
- Added unit and integration tests

## Testing
- [x] Unit tests pass (pytest)
- [x] Integration tests pass
- [x] Blind-validator agent approved
- [x] Manual testing on frontend

## Screenshots
(If UI changes)
```

---

## Performance Optimization Checklist

### Backend
- [ ] Database indexes on foreign keys and location fields
- [ ] Use `select_related()` and `prefetch_related()` to avoid N+1 queries
- [ ] Cache frequently accessed data (trainer profiles, search results) with Redis
- [ ] Paginate API responses (max 50 items per page)
- [ ] Use Celery for slow tasks (email sending, background checks)

### Frontend
- [ ] Code splitting with React.lazy() for large components
- [ ] Image optimization (WebP format, lazy loading)
- [ ] Use React Query for API caching and deduplication
- [ ] Memoize expensive calculations with useMemo/useCallback
- [ ] Virtual scrolling for long lists (react-window)

### Database
- [ ] Analyze slow queries with `EXPLAIN ANALYZE`
- [ ] Add indexes on frequently queried fields
- [ ] Archive old data (bookings older than 2 years)

---

## Security Best Practices

### Authentication
- [ ] Never store plain-text passwords (use Django's password hashing)
- [ ] Require email verification before account activation
- [ ] Implement rate limiting on login (5 attempts per 15 minutes)
- [ ] Use HTTPS only (TLS 1.3)
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite)

### API Security
- [ ] Validate all input with serializers
- [ ] Use Django's CSRF protection
- [ ] Require authentication on protected endpoints
- [ ] Sanitize user input to prevent XSS
- [ ] Use parameterized queries (ORM does this automatically)

### Data Privacy
- [ ] Encrypt sensitive data at rest (SSN for background checks)
- [ ] Don't log sensitive data (passwords, credit cards)
- [ ] Implement GDPR data export and deletion
- [ ] Use Stripe for payment data (PCI compliant, no storage on server)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass (unit, integration, E2E)
- [ ] Security audit completed (OWASP checklist)
- [ ] Load testing completed (500 concurrent users)
- [ ] Database migrations tested on staging
- [ ] Environment variables configured on production server
- [ ] SSL certificate installed
- [ ] Monitoring set up (Sentry, UptimeRobot)

### Deployment Steps
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Run database migrations
cd backend
python manage.py migrate --noinput

# 3. Collect static files
python manage.py collectstatic --noinput

# 4. Restart application server
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# 5. Verify deployment
curl https://api.fitconnect.com/api/health/
```

### Post-Deployment
- [ ] Smoke test critical flows (search, booking, payment)
- [ ] Monitor error rates in Sentry
- [ ] Check server logs for errors
- [ ] Verify email delivery (confirmation emails)
- [ ] Test from different devices (mobile, desktop)

---

## Getting Help

### Documentation
- **Django**: https://docs.djangoproject.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **PostGIS**: https://postgis.net/documentation/

### Debugging
1. Check Django logs: `tail -f backend/logs/django.log`
2. Check browser console for frontend errors
3. Use Django Debug Toolbar for SQL query analysis
4. Use React DevTools for component inspection

### Code Review
- Use blind-validator agent before marking tasks complete
- Request peer review on complex features
- Check PRD acceptance criteria: `.taskmaster/docs/prd.md`

---

## Keeping CLAUDE.md and codex.md in Sync

If you're using both Claude Code and Codex (which uses `codex.md`), keep these files synchronized:

**When to Update**:
- After adding new tech stack components
- After changing project structure
- After updating testing strategies
- After adding new conventions or patterns

**How to Sync**:
```bash
# If content is identical, just copy
cp CLAUDE.md codex.md

# If content differs, manually merge changes to keep both updated
```

**Best Practice**: Treat `CLAUDE.md` as the source of truth. When you update workflow guides or conventions, update CLAUDE.md first, then copy relevant sections to codex.md.

---

## Summary: Your Development Checklist

For every task:
1. ✅ Read task file (`.taskmaster/tasks/TASK-XXX-*.md`)
2. ✅ Write tests first (TDD red phase)
3. ✅ Implement feature (TDD green phase)
4. ✅ Refactor code (TDD refactor phase)
5. ✅ Run blind-validator agent
6. ✅ Fix issues found by agent
7. ✅ Mark task complete (check off sub-tasks in task file)
8. ✅ Commit with descriptive message
9. ✅ Move to next task

**Remember**: Quality over speed. TDD and blind-validator agents prevent bugs from reaching production.

---

**Last Updated**: 2025-11-06 (v1.0)
