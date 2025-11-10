from users.models import User

# Create a new trainer for testing
email = 'testtrainer@fitconnect.com'

# Check if exists first
if User.objects.filter(email=email).exists():
    print(f'Trainer {email} already exists')
else:
    user = User.objects.create_user(
        username='testtrainer',
        email=email,
        password='testpass123',
        role='trainer',
        first_name='Test',
        last_name='Trainer'
    )
    user.email_verified = True
    user.save()
    print(f'Created trainer: {email}')
    print(f'Username: testtrainer')
    print(f'Password: testpass123')
