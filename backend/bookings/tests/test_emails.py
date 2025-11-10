"""
Tests for booking email notifications.

Tests email sending functionality for booking confirmations
to both clients and trainers.
"""

import pytest
from django.core import mail
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal

from bookings.models import Booking
from bookings.emails import (
    send_booking_notification_emails,
    send_client_booking_confirmation,
    send_trainer_booking_notification
)
from users.models import User
from trainers.models import TrainerProfile


@pytest.fixture
def client_user(db):
    """Create a client user for testing"""
    return User.objects.create_user(
        username='client',
        email='client@test.com',
        password='testpass123',
        role='client',
        first_name='John',
        last_name='Doe'
    )


@pytest.fixture
def trainer_user(db):
    """Create a trainer user for testing"""
    return User.objects.create_user(
        username='trainer',
        email='trainer@test.com',
        password='testpass123',
        role='trainer',
        first_name='Jane',
        last_name='Smith'
    )


@pytest.fixture
def trainer_profile(trainer_user):
    """Create a trainer profile for testing"""
    profile = TrainerProfile.objects.create(
        user=trainer_user,
        bio='Experienced trainer',
        hourly_rate=Decimal('75.00'),
        years_experience=5,
        address='123 Gym Street, Chicago, IL 60601'
    )
    # Note: specializations is a ManyToMany field, so we don't set it for email tests
    # as it requires Specialization objects to exist first
    return profile


@pytest.fixture
def booking(client_user, trainer_profile):
    """Create a booking for testing"""
    tomorrow = date.today() + timedelta(days=1)
    return Booking.objects.create(
        client=client_user,
        trainer=trainer_profile,
        session_date=tomorrow,
        start_time=time(10, 0),
        end_time=time(11, 0),
        duration_minutes=60,
        location_address='123 Gym Street, Chicago, IL 60601',
        hourly_rate=Decimal('75.00'),  # Add the required hourly_rate field
        total_price=Decimal('75.00'),
        client_notes='Focus on core strength',
        status='pending'
    )


@pytest.mark.django_db
class TestBookingEmails:
    """Test suite for booking email notifications"""

    def test_send_client_booking_confirmation(self, booking):
        """Test that client receives booking confirmation email"""
        # Send email
        result = send_client_booking_confirmation(booking)

        # Verify email was sent successfully
        assert result is True
        assert len(mail.outbox) == 1

        # Verify email details
        email = mail.outbox[0]
        assert 'Booking Confirmation' in email.subject
        assert booking.client.email in email.to
        assert 'John' in email.body  # Client first name
        assert 'Jane Smith' in email.body  # Trainer full name
        assert booking.location_address in email.body
        assert str(booking.total_price) in email.body

    def test_send_trainer_booking_notification(self, booking):
        """Test that trainer receives booking notification email"""
        # Send email
        result = send_trainer_booking_notification(booking)

        # Verify email was sent successfully
        assert result is True
        assert len(mail.outbox) == 1

        # Verify email details
        email = mail.outbox[0]
        assert 'New Booking Request' in email.subject
        assert booking.trainer.user.email in email.to
        assert 'Jane' in email.body  # Trainer first name
        assert 'John Doe' in email.body  # Client full name
        assert booking.location_address in email.body
        assert str(booking.total_price) in email.body

    def test_send_booking_notification_emails(self, booking):
        """Test that both client and trainer receive emails"""
        # Send both emails
        client_sent, trainer_sent = send_booking_notification_emails(booking)

        # Verify both emails were sent successfully
        assert client_sent is True
        assert trainer_sent is True
        assert len(mail.outbox) == 2

        # Verify recipients
        recipients = [email.to[0] for email in mail.outbox]
        assert booking.client.email in recipients
        assert booking.trainer.user.email in recipients

    def test_client_email_contains_booking_details(self, booking):
        """Test that client email contains all booking details"""
        send_client_booking_confirmation(booking)

        email = mail.outbox[0]
        email_body = email.body

        # Check all important details are included
        assert booking.client.first_name in email_body
        assert f"{booking.trainer.user.first_name} {booking.trainer.user.last_name}" in email_body
        assert booking.location_address in email_body
        assert str(booking.total_price) in email_body
        assert booking.client_notes in email_body
        assert str(booking.duration_minutes) in email_body

    def test_trainer_email_contains_booking_details(self, booking):
        """Test that trainer email contains all booking details"""
        send_trainer_booking_notification(booking)

        email = mail.outbox[0]
        email_body = email.body

        # Check all important details are included
        assert booking.trainer.user.first_name in email_body
        assert f"{booking.client.first_name} {booking.client.last_name}" in email_body
        assert booking.location_address in email_body
        assert str(booking.total_price) in email_body
        assert booking.client_notes in email_body
        assert str(booking.duration_minutes) in email_body

    def test_email_has_html_alternative(self, booking):
        """Test that emails include HTML alternative content"""
        send_client_booking_confirmation(booking)

        email = mail.outbox[0]

        # Verify HTML alternative exists
        assert len(email.alternatives) == 1
        html_content, content_type = email.alternatives[0]
        assert content_type == 'text/html'
        assert '<html>' in html_content.lower()
        assert booking.client.first_name in html_content

    def test_client_email_without_notes(self, booking):
        """Test client email when booking has no client notes"""
        booking.client_notes = ''
        booking.save()

        result = send_client_booking_confirmation(booking)

        assert result is True
        assert len(mail.outbox) == 1

    def test_email_from_address(self, booking):
        """Test that emails are sent from correct address"""
        send_booking_notification_emails(booking)

        for email in mail.outbox:
            # Should use DEFAULT_FROM_EMAIL from settings
            assert 'FitConnect' in email.from_email or 'noreply' in email.from_email

    def test_client_email_failure_returns_false(self, booking, monkeypatch):
        """Test that email failure is handled gracefully"""
        # Mock email.send() to raise an exception
        def mock_send_fail(self):
            raise Exception("SMTP server error")

        monkeypatch.setattr(
            'django.core.mail.message.EmailMultiAlternatives.send',
            mock_send_fail
        )

        result = send_client_booking_confirmation(booking)

        # Should return False on failure
        assert result is False

    def test_trainer_email_failure_returns_false(self, booking, monkeypatch):
        """Test that trainer email failure is handled gracefully"""
        # Mock email.send() to raise an exception
        def mock_send_fail(self):
            raise Exception("SMTP server error")

        monkeypatch.setattr(
            'django.core.mail.message.EmailMultiAlternatives.send',
            mock_send_fail
        )

        result = send_trainer_booking_notification(booking)

        # Should return False on failure
        assert result is False

    def test_partial_email_failure_handled(self, booking, monkeypatch):
        """Test that if one email fails, the other still succeeds"""
        # Track how many times send is called
        send_count = {'count': 0}

        def mock_send_sometimes_fail(self):
            send_count['count'] += 1
            if send_count['count'] == 1:
                raise Exception("First email failed")
            # Second email succeeds (do nothing, default behavior)

        monkeypatch.setattr(
            'django.core.mail.message.EmailMultiAlternatives.send',
            mock_send_sometimes_fail
        )

        client_sent, trainer_sent = send_booking_notification_emails(booking)

        # First email should fail, second should succeed
        assert client_sent is False
        assert trainer_sent is True  # Second email should succeed

    def test_booking_status_in_email(self, booking):
        """Test that booking status is included in emails"""
        send_booking_notification_emails(booking)

        for email in mail.outbox:
            # Status should be mentioned in email body
            assert 'pending' in email.body.lower() or 'Pending' in email.body
