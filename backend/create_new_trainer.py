from users.models import User

# Create a new trainer for testing
email = 'newtrainer@fitconnect.com'
username = 'newtrainer2024'

# Check if exists first
if User.objects.filter(email=email).exists():
    print(f'Trainer {email} already exists')
    user = User.objects.get(email=email)
    print(f'Email: {email}')
    print(f'Username: {user.username}')
    print(f'Password: testpass123 (if unchanged)')
else:
    user = User.objects.create_user(
        username=username,
        email=email,
        password='testpass123',
        role='trainer',
        first_name='New',
        last_name='Trainer'
    )
    user.email_verified = True
    user.save()
    print(f'✓ Created new trainer!')
    print(f'Email: {email}')
    print(f'Username: {username}')
    print(f'Password: testpass123')
