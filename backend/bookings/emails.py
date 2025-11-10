"""
Email notification utilities for booking system.

Handles sending booking confirmation emails to clients and trainers.
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_booking_notification_emails(booking):
    """
    Send booking notification emails to both client and trainer.

    Args:
        booking: Booking instance

    Returns:
        tuple: (client_sent, trainer_sent) - Boolean tuple indicating success
    """
    client_sent = send_client_booking_confirmation(booking)
    trainer_sent = send_trainer_booking_notification(booking)

    return (client_sent, trainer_sent)


def send_client_booking_confirmation(booking):
    """
    Send booking confirmation email to the client.

    Args:
        booking: Booking instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Prepare context for email template
        context = {
            'client_name': booking.client.first_name or 'Client',
            'trainer_name': f"{booking.trainer.user.first_name} {booking.trainer.user.last_name}",
            'session_date': booking.session_date,
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'duration_minutes': booking.duration_minutes,
            'location_address': booking.location_address,
            'total_price': booking.total_price,
            'client_notes': booking.client_notes,
            'status': booking.status,
            'status_display': booking.get_status_display(),
            'site_url': settings.SITE_URL,
            'site_name': settings.SITE_NAME,
        }

        # Render email templates
        subject = f'Booking Confirmation - {booking.session_date.strftime("%b %d, %Y")}'
        text_content = render_to_string(
            'bookings/emails/client_booking_confirmation.txt',
            context
        )
        html_content = render_to_string(
            'bookings/emails/client_booking_confirmation.html',
            context
        )

        # Create and send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.client.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        logger.info(f"Client booking confirmation sent to {booking.client.email} for booking {booking.id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send client booking confirmation for booking {booking.id}: {str(e)}")
        return False


def send_trainer_booking_notification(booking):
    """
    Send booking notification email to the trainer.

    Args:
        booking: Booking instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Prepare context for email template
        context = {
            'trainer_name': booking.trainer.user.first_name or 'Trainer',
            'client_name': f"{booking.client.first_name} {booking.client.last_name}",
            'session_date': booking.session_date,
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'duration_minutes': booking.duration_minutes,
            'location_address': booking.location_address,
            'total_price': booking.total_price,
            'client_notes': booking.client_notes,
            'status': booking.status,
            'status_display': booking.get_status_display(),
            'site_url': settings.SITE_URL,
            'site_name': settings.SITE_NAME,
        }

        # Render email templates
        subject = f'New Booking Request - {booking.session_date.strftime("%b %d, %Y")}'
        text_content = render_to_string(
            'bookings/emails/trainer_booking_notification.txt',
            context
        )
        html_content = render_to_string(
            'bookings/emails/trainer_booking_notification.html',
            context
        )

        # Create and send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.trainer.user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        logger.info(f"Trainer booking notification sent to {booking.trainer.user.email} for booking {booking.id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send trainer booking notification for booking {booking.id}: {str(e)}")
        return False
