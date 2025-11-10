from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, ClientProfile, TrainerProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Create appropriate profile when user is created based on role.
    """
    if created:
        if instance.role == 'client':
            ClientProfile.objects.create(user=instance)
        elif instance.role == 'trainer':
            TrainerProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save profile when user is saved.
    """
    if instance.role == 'client' and hasattr(instance, 'client_profile'):
        instance.client_profile.save()
    elif instance.role == 'trainer' and hasattr(instance, 'trainer_profile'):
        instance.trainer_profile.save()
