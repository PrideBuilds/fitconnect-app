from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review, Booking
from .emails import send_booking_notification_emails
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Review)
def update_trainer_rating_on_save(sender, instance, created, **kwargs):
    """
    Update trainer's average rating and review count when a review is created or updated.

    Args:
        sender: The Review model class
        instance: The Review instance that was saved
        created: Boolean indicating if this is a new review
        **kwargs: Additional keyword arguments
    """
    trainer = instance.trainer

    # Calculate average rating from all visible reviews for this trainer
    stats = Review.objects.filter(
        trainer=trainer,
        is_visible=True
    ).aggregate(
        avg_rating=Avg('rating'),
        review_count=Count('id')
    )

    # Update trainer profile
    trainer.average_rating = stats['avg_rating'] or 0.00
    trainer.total_reviews = stats['review_count'] or 0
    trainer.save(update_fields=['average_rating', 'total_reviews'])


@receiver(post_delete, sender=Review)
def update_trainer_rating_on_delete(sender, instance, **kwargs):
    """
    Update trainer's average rating and review count when a review is deleted.

    Args:
        sender: The Review model class
        instance: The Review instance that was deleted
        **kwargs: Additional keyword arguments
    """
    trainer = instance.trainer

    # Calculate average rating from remaining visible reviews for this trainer
    stats = Review.objects.filter(
        trainer=trainer,
        is_visible=True
    ).aggregate(
        avg_rating=Avg('rating'),
        review_count=Count('id')
    )

    # Update trainer profile
    trainer.average_rating = stats['avg_rating'] or 0.00
    trainer.total_reviews = stats['review_count'] or 0
    trainer.save(update_fields=['average_rating', 'total_reviews'])


# ============================================================================
# BOOKING EMAIL NOTIFICATIONS
# ============================================================================

@receiver(post_save, sender=Booking)
def send_booking_emails(sender, instance, created, **kwargs):
    """
    Send email notifications when a booking is created.
    
    Args:
        sender: The Booking model class
        instance: The Booking instance that was saved
        created: Boolean indicating if this is a new booking
        **kwargs: Additional keyword arguments
    """
    if created:
        # Send emails to both client and trainer when booking is created
        try:
            logger.info(f"Sending booking notification emails for booking {instance.id}")
            client_sent, trainer_sent = send_booking_notification_emails(instance)
            
            if client_sent:
                logger.info(f"✓ Client email sent successfully for booking {instance.id}")
            else:
                logger.warning(f"✗ Client email failed for booking {instance.id}")
                
            if trainer_sent:
                logger.info(f"✓ Trainer email sent successfully for booking {instance.id}")
            else:
                logger.warning(f"✗ Trainer email failed for booking {instance.id}")
                
        except Exception as e:
            logger.error(f"Error sending booking emails for booking {instance.id}: {str(e)}")
