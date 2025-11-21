# Media File Configuration

## Overview
Media file handling is now configured for trainer photos, certifications, and other user uploads.

## Development Setup ✅

### Configuration
- **MEDIA_URL**: `/media/` - URL path to serve media files
- **MEDIA_ROOT**: `backend/media/` - Local directory for uploaded files
- **Parsers**: MultiPartParser and FormParser added for file uploads
- **URL routing**: Media files served at `http://localhost:8000/media/` in DEBUG mode

### File Upload Models
Files are uploaded to:
- **Trainer Photos**: `media/trainers/photos/`
- **Trainer Certifications**: `media/trainers/certifications/`
- **User Avatars**: `media/users/avatars/` (if implemented)

### Testing Uploads
1. **Via Django Admin**:
   ```
   http://localhost:8000/admin
   ```

2. **Via API**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/trainers/{id}/photos/ \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@path/to/photo.jpg" \
     -F "photo_type=profile"
   ```

3. **Via Frontend**: Use the ProfileWizard component's PhotosStep

### Accessing Uploaded Files
- **Backend**: `http://localhost:8000/media/trainers/photos/filename.jpg`
- **Frontend**: Full URL is returned in API responses

---

## Production Setup 🚀

### Option 1: AWS S3 (Recommended)

**Why S3?**
- Scalable and reliable
- CDN integration (CloudFront)
- No server storage limits
- Automatic backups

**Installation**:
```bash
pip install boto3 django-storages
```

**Settings** (`backend/fitconnect/settings.py`):
```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    ...
    'storages',
]

# AWS Configuration
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',  # Cache for 1 day
}
AWS_DEFAULT_ACL = 'public-read'

# Use S3 for media files in production
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

**Environment Variables** (`.env`):
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=fitconnect-media
AWS_S3_REGION_NAME=us-east-1
```

**S3 Bucket Setup**:
1. Create S3 bucket: `fitconnect-media`
2. Enable public read access for objects
3. Add CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
4. (Optional) Set up CloudFront distribution for CDN

---

### Option 2: DigitalOcean Spaces (Alternative)

**Installation**:
```bash
pip install boto3 django-storages
```

**Settings**:
```python
AWS_ACCESS_KEY_ID = config('DO_SPACES_KEY')
AWS_SECRET_ACCESS_KEY = config('DO_SPACES_SECRET')
AWS_STORAGE_BUCKET_NAME = config('DO_SPACES_BUCKET')
AWS_S3_ENDPOINT_URL = config('DO_SPACES_ENDPOINT')  # e.g., https://nyc3.digitaloceanspaces.com
AWS_S3_REGION_NAME = config('DO_SPACES_REGION', default='nyc3')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.{AWS_S3_REGION_NAME}.digitaloceanspaces.com'
AWS_DEFAULT_ACL = 'public-read'

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

---

### Option 3: Local Server Storage (Not Recommended for Production)

**Only use if you have:**
- Single server (no load balancing)
- Regular backups
- Sufficient disk space

**Configuration**:
```python
# Keep current settings
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**Nginx Configuration** (`/etc/nginx/sites-available/fitconnect`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve media files
    location /media/ {
        alias /path/to/fitconnect/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Serve static files
    location /static/ {
        alias /path/to/fitconnect/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Backup Strategy**:
```bash
# Daily cron job
0 2 * * * tar -czf /backups/media-$(date +\%Y\%m\%d).tar.gz /path/to/media/
```

---

## File Size Limits

### Development
- **Max file size**: 5MB (default Django)
- **Allowed types**: jpg, jpeg, png, pdf

### Production
Configure in settings:
```python
# Maximum upload size (in bytes)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB

# For larger files, use streaming uploads
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000
```

**Nginx** (if using local storage):
```nginx
client_max_body_size 10M;
```

---

## Security Best Practices

### 1. Validate File Types
Already implemented in `trainers/models.py`:
```python
def validate_image(image):
    # Checks file extension and MIME type
    valid_types = ['image/jpeg', 'image/png', 'image/jpg']
    ...
```

### 2. Virus Scanning (Production)
Consider adding ClamAV scanning:
```bash
pip install clamd
```

### 3. Content Security Policy
Add CSP headers for image sources:
```python
CSP_IMG_SRC = ["'self'", "https://fitconnect-media.s3.amazonaws.com"]
```

### 4. Signed URLs (S3)
For sensitive documents (certifications):
```python
from boto3 import client
s3 = client('s3')
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'fitconnect-media', 'Key': 'path/to/file'},
    ExpiresIn=3600  # 1 hour
)
```

---

## Troubleshooting

### Images not loading in frontend
**Check**:
1. CORS enabled on S3 bucket
2. Bucket policy allows public read
3. API returns full URL (not relative path)

### Uploads failing
**Check**:
1. `MultiPartParser` in `REST_FRAMEWORK` settings
2. File size within limits
3. S3 credentials correct
4. Bucket exists and is accessible

### Slow uploads
**Solutions**:
1. Use CloudFront CDN with S3
2. Enable compression (gzip/brotli)
3. Implement client-side image compression before upload
4. Use direct S3 uploads (presigned URLs)

---

## Migration Checklist

When moving to production:
- [ ] Install django-storages and boto3
- [ ] Create S3 bucket or DigitalOcean Space
- [ ] Configure bucket CORS and permissions
- [ ] Add AWS credentials to production .env
- [ ] Update Django settings for S3
- [ ] Test file upload in production
- [ ] Migrate existing media files to S3
- [ ] Update frontend API URLs if needed
- [ ] Set up CloudFront (optional but recommended)
- [ ] Configure backup strategy
- [ ] Add monitoring for storage usage

---

## Cost Estimates (AWS S3)

**Storage**:
- $0.023 per GB/month (first 50 TB)
- 10,000 trainer photos (~5GB) = $0.12/month

**Data Transfer**:
- First 1 GB free
- Next 10 TB: $0.09 per GB
- 100GB/month = $9/month

**Requests**:
- GET: $0.0004 per 1,000 requests
- PUT: $0.005 per 1,000 requests

**Estimated monthly cost**: $10-50 for early-stage startup

---

## Next Steps

1. **Development**: ✅ Already configured, test uploads
2. **Production**: Choose S3/Spaces, follow setup guide above
3. **Testing**: Upload test photos via frontend
4. **Monitoring**: Track storage usage and costs

**Questions?** Check Django docs: https://docs.djangoproject.com/en/4.2/topics/files/
