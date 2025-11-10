# FitConnect

Peer-to-peer marketplace connecting travelers with personal trainers and gyms across the United States.

## Tech Stack

- **Frontend**: React 18+ with Vite, Tailwind CSS, React Router, React Query
- **Backend**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL 15+ with PostGIS extension (geospatial queries)
- **Payments**: Stripe (future)
- **Maps**: Google Maps API (future)
- **Testing**: Pytest (backend), Vitest (frontend)

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- PostGIS extension
- Git

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd fitconnect-app
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example or create manually)
cat > .env << EOF
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
DB_NAME=fitconnect
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
EOF

# Run migrations
python manage.py migrate

# Create superuser (optional, for admin access)
python manage.py createsuperuser
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional)
cat > .env << EOF
VITE_API_URL=http://localhost:8000/api/v1
EOF
```

### 4. Database Setup

```bash
# Create database (if not exists)
createdb fitconnect

# Enable PostGIS extension
psql fitconnect -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify PostGIS
psql fitconnect -c "SELECT postgis_version();"
```

## Running the Application

### Development Servers

Run both servers in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **Health Check**: http://localhost:8000/api/health/

## Running Tests

### Backend Tests (Pytest)

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov

# Run specific test file
pytest tests/test_health.py
```

### Frontend Tests (Vitest)

```bash
cd frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Project Structure

```
fitconnect-app/
├── backend/               # Django REST API
│   ├── fitconnect/       # Project settings
│   ├── users/            # User auth and profiles
│   ├── trainers/         # Trainer profiles and search
│   ├── bookings/         # Booking system
│   ├── tests/            # Backend tests
│   ├── manage.py
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── test/        # Test setup
│   │   └── App.jsx
│   ├── package.json
│   └── vitest.config.js
├── .taskmaster/          # Task management
│   ├── docs/prd.md      # Product requirements
│   └── tasks/           # Task files
├── CLAUDE.md            # Development workflow guide
└── README.md            # This file
```

## Documentation

- **PRD**: `.taskmaster/docs/prd.md` - Complete product requirements
- **Workflow Guide**: `CLAUDE.md` - Development workflow and TDD approach
- **Tasks**: `.taskmaster/tasks/` - All implementation tasks

## Development Workflow

1. **Read task file** (`.taskmaster/tasks/TASK-XXX-*.md`)
2. **Write tests first** (TDD approach - see `CLAUDE.md`)
3. **Implement feature** to make tests pass
4. **Run tests** to verify
5. **Commit changes** with descriptive message

See `CLAUDE.md` for detailed TDD workflow and best practices.

## Environment Variables

### Backend (.env)

```
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=fitconnect
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Restart PostgreSQL
brew services restart postgresql@17   # macOS
sudo systemctl restart postgresql     # Linux
```

### GDAL/PostGIS Issues

If you see errors about GDAL library not found:
```bash
# macOS
brew install gdal postgis

# The Django settings are already configured to find GDAL
# Check backend/fitconnect/settings.py for GDAL_LIBRARY_PATH
```

### Port Already in Use

```bash
# Backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

## Timeline

- **Phase 1 (MVP)**: 4 weeks - Core matching & booking
- **Phase 2 (Payments & Reviews)**: 4 weeks - Stripe integration, reviews
- **Phase 3 (Launch)**: 4 weeks - Advanced features, deployment

**Total**: 12 weeks, 55 tasks, ~246 hours

## Current Status

✅ TASK-001: Project Setup - COMPLETED
- Django backend with PostGIS configured
- React frontend with Tailwind CSS
- PostgreSQL database initialized
- Health check endpoint working
- Pytest and Vitest configured
- Development environment ready

**Next**: TASK-002 - User Authentication System

## Contributing

1. Create a feature branch from `main`
2. Follow TDD approach (write tests first)
3. Ensure all tests pass before committing
4. Use conventional commit messages
5. Submit pull request for review

## License

[To be determined]
