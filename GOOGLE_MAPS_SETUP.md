# Google Maps API Setup Guide

This guide explains how to get a Google Maps API key and configure it for FitConnect's geocoding and address autocomplete features.

## Features Using Google Maps API

- **Frontend**: Address autocomplete in ProfileWizard (Location Step)
- **Backend**: Automatic geocoding of addresses to lat/lng coordinates

## Step 1: Get a Google Maps API Key

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Name your project (e.g., "FitConnect")
5. Click "Create"

### 1.2 Enable Required APIs

You need to enable these APIs for your project:

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable each of these APIs:
   - **Places API** (for address autocomplete)
   - **Geocoding API** (for converting addresses to coordinates)
   - **Maps JavaScript API** (required for Places Autocomplete to work)

### 1.3 Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. Copy the generated API key (you'll need this in Step 2)
4. Click "Edit API key" to restrict it (recommended for security)

### 1.4 Restrict Your API Key (Recommended)

**For Development:**
1. Under "Application restrictions", select "HTTP referrers"
2. Add: `http://localhost:5173/*`
3. Under "API restrictions", select "Restrict key"
4. Choose:
   - Places API
   - Geocoding API
   - Maps JavaScript API

**For Production:**
- Update HTTP referrers to your production domain
- Consider separate API keys for frontend (restricted to domain) and backend (restricted to IP)

## Step 2: Configure FitConnect

### 2.1 Backend Configuration

1. Open `backend/.env`
2. Add your API key:
   ```
   GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```

### 2.2 Frontend Configuration

1. Open `frontend/.env`
2. Add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
   ```

### 2.3 Restart Servers

**Backend:**
```bash
# Stop the Django server (Ctrl+C if running)
# Restart it
cd backend
source venv/bin/activate
python manage.py runserver
```

**Frontend:**
```bash
# The Vite dev server should auto-reload
# If not, restart it:
cd frontend
npm run dev
```

## Step 3: Verify It's Working

### 3.1 Test Frontend Autocomplete

1. Log in as a trainer
2. Navigate to Profile Creation → Location Step (Step 3)
3. Start typing an address in the Address field
4. You should see address suggestions appear

### 3.2 Test Backend Geocoding

1. Complete the profile wizard with an address
2. Check the Django server logs - you should see:
   ```
   INFO Successfully geocoded address to: -122.xxx, 37.xxx
   ```

## Troubleshooting

### Address Autocomplete Not Working

**Check 1: API Key Set Correctly**
```bash
# In browser console:
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
# Should show your API key
```

**Check 2: Places API Enabled**
- Verify Places API is enabled in Google Cloud Console
- Check browser console for errors

**Check 3: API Key Restrictions**
- Make sure `http://localhost:5173` is in allowed HTTP referrers

### Backend Geocoding Not Working

**Check 1: API Key in Django**
```bash
cd backend
source venv/bin/activate
python manage.py shell

>>> from django.conf import settings
>>> print(settings.GOOGLE_MAPS_API_KEY)
# Should show your API key
```

**Check 2: Geocoding API Enabled**
- Verify Geocoding API is enabled in Google Cloud Console

**Check 3: Check Django Logs**
```bash
# Look for errors in terminal running Django server
# Common issues:
# - "GOOGLE_MAPS_API_KEY not configured" → .env not loaded
# - "API key not valid" → Wrong key or not enabled
# - "REQUEST_DENIED" → API not enabled or billing not set up
```

### Google Maps Billing

- Google Maps APIs require a billing account
- There's a generous free tier: $200/month in free usage
- For development, you'll likely stay within free tier
- Geocoding: $5 per 1000 requests (after free tier)
- Places Autocomplete: $2.83 per 1000 sessions

## Security Best Practices

1. **Never commit API keys to git**
   - `.env` files are in `.gitignore`
   - Double-check before pushing code

2. **Use separate keys for frontend/backend**
   - Frontend key: Restricted to your domain
   - Backend key: Restricted to server IP

3. **Monitor API usage**
   - Check Google Cloud Console regularly
   - Set up billing alerts

4. **Rotate keys periodically**
   - Create new keys every few months
   - Delete old keys after migration

## Graceful Fallback

FitConnect handles missing API keys gracefully:

- **Frontend**: Falls back to regular text input if API key not set
- **Backend**: Allows profile creation without geocoding (location will be null)

This means the app will work without a Google Maps API key, but you'll lose:
- Address autocomplete
- Automatic lat/lng geocoding
- Distance-based trainer search (requires coordinates)

---

**Need Help?**
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API Docs](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding/overview)
