# TASK-001: Project Setup (Django + React + PostgreSQL + PostGIS)

**Epic:** Phase 1 - Sprint 1 (Week 1) - Foundation
**Complexity:** Medium (6 hours)
**Dependencies:** None
**Assignee:** Full-stack Developer
**Status:** Ready

---

## Overview

Set up the complete development environment for FitConnect marketplace including Django backend with PostGIS, React frontend with Tailwind CSS, PostgreSQL database, and all necessary development tools.

---

## Sub-Tasks

- [ ] 1. Create project directory structure
  - Create `fitconnect/` root directory
  - Create `backend/` and `frontend/` subdirectories
  - Initialize git repository

- [ ] 2. Set up Python virtual environment and install Django
  - Create virtual environment with Python 3.11+
  - Install Django 5.0, Django REST Framework
  - Create requirements.txt

- [ ] 3. Initialize Django project
  - Create Django project `fitconnect`
  - Configure settings for development
  - Create initial apps: `users`, `trainers`, `bookings`

- [ ] 4. Set up PostgreSQL database with PostGIS extension
  - Install PostgreSQL 15+
  - Create `fitconnect` database
  - Enable PostGIS extension
  - Configure Django database settings

- [ ] 5. Initialize React project with Vite
  - Create React app with Vite
  - Install Tailwind CSS
  - Configure Tailwind
  - Set up React Router

- [ ] 6. Configure development environment
  - Create `.env` files for backend and frontend
  - Set up CORS for local development
  - Configure static file handling
  - Create docker-compose.yml (optional)

- [ ] 7. Verify setup with hello world endpoints
  - Create Django health check endpoint
  - Create React hello world page
  - Test backend-frontend connection
  - Run both servers simultaneously

- [ ] 8. Set up version control
  - Initialize git repository (if not done)
  - Create .gitignore files
  - Make initial commit
  - Create README.md with setup instructions

---

## Implementation Guide

### Step 1: Create Project Directory Structure

```bash
# Create project root
mkdir fitconnect
cd fitconnect

# Create backend and frontend directories
mkdir backend frontend

# Initialize git repository
git init
```

### Step 2: Set Up Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Django and dependencies
pip install django==5.0 djangorestframework==3.14 django-cors-headers psycopg2-binary python-decouple

# Create requirements.txt
pip freeze > requirements.txt
```

**requirements.txt** (initial):
```
Django==5.0
djangorestframework==3.14
django-cors-headers==4.3.0
psycopg2-binary==2.9.9
python-decouple==3.8
```

### Step 3: Initialize Django Project

```bash
# In backend/ directory with venv activated
django-admin startproject fitconnect .

# Create Django apps
python manage.py startapp users
python manage.py startapp trainers
python manage.py startapp bookings
```

**Update `backend/fitconnect/settings.py`:**
```python
import os
from decouple import config

# ... existing code ...

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',

    # Local apps
    'users',
    'trainers',
    'bookings',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Add CORS middleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS settings for local development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}
```

### Step 4: Set Up PostgreSQL with PostGIS

**Install PostgreSQL** (if not installed):
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-15 postgresql-15-postgis-3

# Windows
# Download from https://www.postgresql.org/download/windows/
```

**Install PostGIS**:
```bash
# macOS
brew install postgis

# Ubuntu/Debian
sudo apt-get install postgis

# Verify installation
psql --version
```

**Create Database**:
```bash
# Create database (as postgres user or your user with createdb permission)
createdb fitconnect

# Connect to database and enable PostGIS
psql fitconnect

# In psql shell:
CREATE EXTENSION postgis;
\q
```

**Configure Django Database Settings** in `backend/fitconnect/settings.py`:
```python
# Install django.contrib.gis for PostGIS support
INSTALLED_APPS = [
    # ... existing apps ...
    'django.contrib.gis',  # Add this
    # ... rest of apps ...
]

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',  # PostGIS engine
        'NAME': config('DB_NAME', default='fitconnect'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}
```

**Create `.env` file** in `backend/`:
```
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
DB_NAME=fitconnect
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

**Run Migrations**:
```bash
python manage.py migrate
```

### Step 5: Initialize React Project with Vite

```bash
# Navigate to frontend directory
cd ../frontend

# Create Vite + React project
npm create vite@latest . -- --template react

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install React Router and Axios
npm install react-router-dom axios

# Install dev dependencies
npm install -D @vitejs/plugin-react
```

**Configure Tailwind** - Update `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Update `frontend/src/index.css`**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Update `frontend/vite.config.js`** for API proxy:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

### Step 6: Configure Development Environment

**Create `backend/.env`**:
```
DEBUG=True
SECRET_KEY=django-insecure-change-this-in-production-abc123xyz789
DB_NAME=fitconnect
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Create `frontend/.env`**:
```
VITE_API_URL=http://localhost:8000/api/v1
```

**Create `backend/.gitignore`**:
```
# Python
venv/
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
dist/
*.egg-info/

# Django
*.log
db.sqlite3
media/
staticfiles/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
```

**Create `frontend/.gitignore`**:
```
# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# Misc
.DS_Store
*.log
```

**Optional: Create `docker-compose.yml`** in root:
```yaml
version: '3.8'

services:
  db:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: fitconnect
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DEBUG=True
      - DB_HOST=db

  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Step 7: Verify Setup with Hello World

**Create Health Check Endpoint** - `backend/fitconnect/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'message': 'FitConnect API is running',
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
]
```

**Update React App** - `frontend/src/App.jsx`:
```jsx
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health/')
      .then(res => res.json())
      .then(data => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch health:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          FitConnect
        </h1>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : health ? (
          <div>
            <p className="text-green-600 font-semibold">
              ✓ Backend Connected
            </p>
            <p className="text-gray-600 mt-2">
              Status: {health.status}
            </p>
            <p className="text-gray-600">
              Version: {health.version}
            </p>
          </div>
        ) : (
          <p className="text-red-600">
            ✗ Backend Connection Failed
          </p>
        )}
      </div>
    </div>
  )
}

export default App
```

**Run Both Servers**:
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Test**:
- Backend health check: `curl http://localhost:8000/api/health/`
- Frontend: Open browser to `http://localhost:3000`
- Should see "Backend Connected" message

### Step 8: Set Up Version Control

**Create `.gitignore`** in root:
```
# TaskMaster state (don't commit)
.taskmaster/state.json
.taskmaster/tasks/*.json

# OS
.DS_Store
Thumbs.db
```

**Create `README.md`** in root:
```markdown
# FitConnect

Peer-to-peer marketplace connecting travelers with personal trainers and gyms.

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL 15 + PostGIS

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- PostGIS extension

### Backend Setup

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your database credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
\`\`\`

### Frontend Setup

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Database Setup

\`\`\`bash
createdb fitconnect
psql fitconnect -c "CREATE EXTENSION postgis;"
\`\`\`

## Development

- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- Admin Panel: http://localhost:8000/admin

## Documentation

See `.taskmaster/docs/prd.md` for full product requirements.
See `CLAUDE.md` for development workflow guide.
```

**Initial Commit**:
```bash
git add .
git commit -m "feat: Initial project setup (TASK-001)

- Django 5.0 backend with DRF
- React 18 + Tailwind CSS frontend with Vite
- PostgreSQL 15 + PostGIS database
- Health check endpoint
- Development environment configured

TASK-001"
```

---

## Acceptance Criteria

- [x] Backend server starts successfully on port 8000
- [x] Frontend server starts successfully on port 3000
- [x] PostgreSQL database `fitconnect` exists with PostGIS extension
- [x] Django migrations run without errors
- [x] Health check endpoint returns JSON response
- [x] Frontend successfully calls backend API and displays response
- [x] Tailwind CSS styles applied correctly (background color, padding, etc.)
- [x] Git repository initialized with proper .gitignore
- [x] README.md includes setup instructions
- [x] All dependencies installed (requirements.txt, package.json)

---

## Test Cases

### Test 1: Backend Health Check
```bash
# Start backend server
cd backend
source venv/bin/activate
python manage.py runserver

# In another terminal
curl http://localhost:8000/api/health/

# Expected output:
# {"status":"healthy","message":"FitConnect API is running","version":"1.0.0"}
```

### Test 2: PostGIS Extension
```bash
psql fitconnect -c "SELECT postgis_version();"

# Expected: Should return PostGIS version (e.g., "3.3.2")
```

### Test 3: Frontend-Backend Connection
```bash
# Start both servers
# Terminal 1: cd backend && python manage.py runserver
# Terminal 2: cd frontend && npm run dev

# Open http://localhost:3000 in browser
# Expected: Should see "Backend Connected" with green checkmark
```

### Test 4: Django Admin Access
```bash
# Create superuser
python manage.py createsuperuser
# Enter username, email, password

# Visit http://localhost:8000/admin
# Expected: Django admin login page appears
# Login with superuser credentials
# Expected: Admin dashboard loads successfully
```

### Test 5: Tailwind CSS Working
```bash
# Frontend should display:
# - Gray background (bg-gray-100)
# - White card with rounded corners (bg-white rounded-lg)
# - Shadow on card (shadow-md)
# - Proper padding (p-8)

# Inspect element in browser DevTools
# Expected: Tailwind utility classes compiled to CSS
```

### Test 6: CORS Configuration
```bash
# Start backend: cd backend && python manage.py runserver
# Start frontend: cd frontend && npm run dev

# In browser console (http://localhost:3000), run:
fetch('http://localhost:8000/api/health/')
  .then(r => r.json())
  .then(d => console.log(d))

# Expected: No CORS error, health data logged to console
```

---

## Troubleshooting

### Issue: `psycopg2` installation fails
**Solution**: Install PostgreSQL development headers
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install libpq-dev python3-dev

# Then retry: pip install psycopg2-binary
```

### Issue: PostGIS extension not found
**Solution**: Install PostGIS package
```bash
# macOS
brew install postgis

# Ubuntu/Debian
sudo apt-get install postgresql-15-postgis-3

# Then in psql:
CREATE EXTENSION postgis;
```

### Issue: Django migrations fail with "relation does not exist"
**Solution**: Ensure database and PostGIS are set up correctly
```bash
# Drop and recreate database
dropdb fitconnect
createdb fitconnect
psql fitconnect -c "CREATE EXTENSION postgis;"

# Retry migrations
python manage.py migrate
```

### Issue: Frontend can't connect to backend (CORS error)
**Solution**: Check CORS settings in `settings.py`
```python
# Ensure corsheaders is installed and configured
INSTALLED_APPS = [..., 'corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```

### Issue: Vite server won't start (port 3000 in use)
**Solution**: Kill process on port 3000 or change port
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.js
server: { port: 3001 }
```

---

## Next Steps

After completing TASK-001:
1. Proceed to **TASK-002**: User authentication system
2. Verify you can run both servers simultaneously
3. Familiarize yourself with project structure
4. Review PRD: `.taskmaster/docs/prd.md`
5. Review development workflow: `CLAUDE.md`

---

## Resources

- Django Documentation: https://docs.djangoproject.com/en/5.0/
- Django REST Framework: https://www.django-rest-framework.org/
- React Documentation: https://react.dev/
- Vite Documentation: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/docs
- PostGIS: https://postgis.net/documentation/

---

**Estimated Time**: 6 hours
**Last Updated**: 2025-11-06
