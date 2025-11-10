from trainers.models import TrainerProfile
from users.models import User

trainers = User.objects.filter(role='trainer')
for t in trainers[:8]:
    profile = TrainerProfile.objects.filter(user=t).first()
    status = 'HAS PROFILE' if profile else 'NO PROFILE'
    print(f'{t.email}: {status}')
