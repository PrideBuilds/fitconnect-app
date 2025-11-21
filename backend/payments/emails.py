"""
Email notification utilities for payment system.

Handles sending payment confirmation, failure, and refund emails.
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_payment_confirmation_email(payment):
    """
    Send payment confirmation email to the client after successful payment.

    Args:
        payment: Payment instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        booking = payment.booking

        # Prepare context for email template
        context = {
            'client_name': payment.client.first_name or 'Client',
            'trainer_name': f"{payment.trainer.user.first_name} {payment.trainer.user.last_name}",
            'payment_amount': payment.amount,
            'currency': payment.currency.upper(),
            'payment_id': payment.id,
            'payment_date': payment.updated_at,
            'session_date': booking.session_date,
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'duration_minutes': booking.duration_minutes,
            'location_address': booking.location_address,
            'receipt_url': payment.receipt_url,
            'booking_id': booking.id,
            'card_brand': payment.card_brand if payment.card_brand else 'Card',
            'card_last4': payment.card_last4 if payment.card_last4 else '****',
            'site_url': settings.SITE_URL,
            'site_name': settings.SITE_NAME,
        }

        # Render email templates
        subject = f'Payment Confirmed - ${payment.amount} for Training Session'
        text_content = render_to_string(
            'payments/emails/payment_confirmation.txt',
            context
        )
        html_content = render_to_string(
            'payments/emails/payment_confirmation.html',
            context
        )

        # Create and send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[payment.client.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        logger.info(f"Payment confirmation email sent to {payment.client.email} for payment {payment.id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send payment confirmation email for payment {payment.id}: {str(e)}")
        return False


def send_payment_failure_email(payment, error_message=None):
    """
    Send payment failure email to the client.

    Args:
        payment: Payment instance
        error_message: Optional error message to include

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        booking = payment.booking

        # Prepare context for email template
        context = {
            'client_name': payment.client.first_name or 'Client',
            'trainer_name': f"{payment.trainer.user.first_name} {payment.trainer.user.last_name}",
            'payment_amount': payment.amount,
            'currency': payment.currency.upper(),
            'session_date': booking.session_date,
            'start_time': booking.start_time,
            'booking_id': booking.id,
            'error_message': error_message or payment.failure_message,
            'failure_code': payment.failure_code,
            'site_url': settings.SITE_URL,
            'site_name': settings.SITE_NAME,
            'payment_url': f"{settings.SITE_URL}/bookings/{booking.id}/payment",
        }

        # Render email templates
        subject = f'Payment Failed - Action Required for Training Session'
        text_content = render_to_string(
            'payments/emails/payment_failure.txt',
            context
        )
        html_content = render_to_string(
            'payments/emails/payment_failure.html',
            context
        )

        # Create and send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[payment.client.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        logger.info(f"Payment failure email sent to {payment.client.email} for payment {payment.id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send payment failure email for payment {payment.id}: {str(e)}")
        return False


def send_refund_confirmation_email(payment, refund_amount, refund_reason=None):
    """
    Send refund confirmation email to the client.

    Args:
        payment: Payment instance
        refund_amount: Amount refunded
        refund_reason: Optional reason for refund

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        booking = payment.booking

        # Prepare context for email template
        context = {
            'client_name': payment.client.first_name or 'Client',
            'trainer_name': f"{payment.trainer.user.first_name} {payment.trainer.user.last_name}",
            'refund_amount': refund_amount,
            'original_amount': payment.amount,
            'currency': payment.currency.upper(),
            'payment_id': payment.id,
            'refund_reason': refund_reason or 'As requested',
            'session_date': booking.session_date,
            'booking_id': booking.id,
            'card_brand': payment.card_brand if payment.card_brand else 'Card',
            'card_last4': payment.card_last4 if payment.card_last4 else '****',
            'site_url': settings.SITE_URL,
            'site_name': settings.SITE_NAME,
            'refund_processing_days': '5-10',  # Typical Stripe refund time
        }

        # Render email templates
        subject = f'Refund Processed - ${refund_amount} for Training Session'
        text_content = render_to_string(
            'payments/emails/refund_confirmation.txt',
            context
        )
        html_content = render_to_string(
            'payments/emails/refund_confirmation.html',
            context
        )

        # Create and send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[payment.client.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

        logger.info(f"Refund confirmation email sent to {payment.client.email} for payment {payment.id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send refund confirmation email for payment {payment.id}: {str(e)}")
        return False
