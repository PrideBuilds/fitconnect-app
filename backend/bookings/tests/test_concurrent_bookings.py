"""
Test concurrent booking prevention using pessimistic locking
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal
from django.db import connection
from django.test.utils import CaptureQueriesContext
import threading
from bookings.models import Booking
from trainers.models import TrainerProfile, Specialization

User = get_user_model()


@pytest.fixture
def trainer_user(db):
    """Create a trainer user"""
    return User.objects.create_user(
        username='trainer1',
        email='trainer@test.com',
        password='password123',
        role='trainer',
        first_name='John',
        last_name='Trainer'
    )


@pytest.fixture
def trainer_profile(db, trainer_user):
    """Create a trainer profile"""
    return TrainerProfile.objects.create(
        user=trainer_user,
        bio='Experienced trainer',
        hourly_rate=Decimal('75.00'),
        address='123 Gym St, Los Angeles, CA',
        published=True,
        years_experience=5
    )


@pytest.fixture
def client_user_1(db):
    """Create first client user"""
    return User.objects.create_user(
        username='client1',
        email='client1@test.com',
        password='password123',
        role='client',
        first_name='Jane',
        last_name='Client'
    )


@pytest.fixture
def client_user_2(db):
    """Create second client user"""
    return User.objects.create_user(
        username='client2',
        email='client2@test.com',
        password='password123',
        role='client',
        first_name='Bob',
        last_name='Client'
    )


@pytest.mark.django_db
class TestConcurrentBookingPrevention:
    """Test that concurrent bookings are prevented using database locking"""

    def test_basic_conflict_detection(self, trainer_profile, client_user_1):
        """Test that basic conflict detection works"""
        tomorrow = date.today() + timedelta(days=1)

        # Create first booking
        booking1 = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user_1,
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='Gym',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Check for conflict - should find booking1
        conflict = Booking.check_booking_conflict(
            trainer=trainer_profile,
            session_date=tomorrow,
            start_time=time(10, 30),  # Overlaps with booking1
            end_time=time(11, 30)
        )

        assert conflict is not None
        assert conflict.id == booking1.id

    def test_no_conflict_different_times(self, trainer_profile, client_user_1):
        """Test that non-overlapping times don't conflict"""
        tomorrow = date.today() + timedelta(days=1)

        # Create first booking
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user_1,
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='Gym',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Check for conflict at different time - should be None
        conflict = Booking.check_booking_conflict(
            trainer=trainer_profile,
            session_date=tomorrow,
            start_time=time(11, 0),  # Starts when first ends
            end_time=time(12, 0)
        )

        assert conflict is None

    def test_conflict_cancelled_bookings_ignored(self, trainer_profile, client_user_1):
        """Test that cancelled bookings don't cause conflicts"""
        tomorrow = date.today() + timedelta(days=1)

        # Create cancelled booking
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user_1,
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='Gym',
            hourly_rate=Decimal('75.00'),
            status='cancelled_by_client'  # Cancelled
        )

        # Check for conflict - should be None since booking is cancelled
        conflict = Booking.check_booking_conflict(
            trainer=trainer_profile,
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0)
        )

        assert conflict is None

    def test_pessimistic_locking_query(self, trainer_profile, client_user_1):
        """Test that select_for_update is used in conflict check"""
        tomorrow = date.today() + timedelta(days=1)

        # Create a booking
        Booking.objects.create(
            trainer=trainer_profile,
            client=client_user_1,
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='Gym',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        # Capture SQL queries to verify SELECT FOR UPDATE is used
        with CaptureQueriesContext(connection) as queries:
            Booking.check_booking_conflict(
                trainer=trainer_profile,
                session_date=tomorrow,
                start_time=time(10, 30),
                end_time=time(11, 30)
            )

            # Check that SELECT FOR UPDATE was used
            sql_queries = [q['sql'] for q in queries.captured_queries]
            has_select_for_update = any('FOR UPDATE' in query.upper() for query in sql_queries)
            assert has_select_for_update, "SELECT FOR UPDATE not found in queries"

    def test_time_overlap_edge_cases(self, trainer_profile, client_user_1):
        """Test various time overlap scenarios"""
        tomorrow = date.today() + timedelta(days=1)

        # Create existing booking: 10:00-11:00
        booking = Booking.objects.create(
            trainer=trainer_profile,
            client=client_user_1,
            session_date=tomorrow,
            start_time=time(10, 0),
            end_time=time(11, 0),
            duration_minutes=60,
            location_address='Gym',
            hourly_rate=Decimal('75.00'),
            status='confirmed'
        )

        test_cases = [
            # (start_time, end_time, should_conflict)
            (time(9, 0), time(10, 30), True),   # Starts before, ends during
            (time(10, 30), time(11, 30), True), # Starts during, ends after
            (time(9, 0), time(12, 0), True),    # Completely contains existing
            (time(10, 15), time(10, 45), True), # Completely contained
            (time(11, 0), time(12, 0), False),  # Starts exactly when existing ends
            (time(9, 0), time(10, 0), False),   # Ends exactly when existing starts
            (time(11, 30), time(12, 30), False),# No overlap
        ]

        for start, end, should_conflict in test_cases:
            conflict = Booking.check_booking_conflict(
                trainer=trainer_profile,
                session_date=tomorrow,
                start_time=start,
                end_time=end
            )
            if should_conflict:
                assert conflict is not None, f"Expected conflict for {start}-{end}"
                assert conflict.id == booking.id
            else:
                assert conflict is None, f"Expected no conflict for {start}-{end}"

    @pytest.mark.django_db(transaction=True)
    def test_serializer_prevents_double_booking(self, trainer_profile, client_user_1, client_user_2):
        """
        Test that the serializer properly prevents double-booking.
        This simulates the actual API flow.
        """
        from bookings.serializers import BookingCreateSerializer
        from django.db import transaction

        tomorrow = date.today() + timedelta(days=1)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': tomorrow,
            'start_time': time(10, 0),
            'end_time': time(11, 0),
            'duration_minutes': 60,
            'location_address': 'Test Gym',
        }

        # First booking should succeed
        with transaction.atomic():
            serializer1 = BookingCreateSerializer(data=booking_data)
            assert serializer1.is_valid(), serializer1.errors
            booking1 = serializer1.save(client=client_user_1)
            assert booking1 is not None

        # Second booking with same time should fail
        with transaction.atomic():
            serializer2 = BookingCreateSerializer(data=booking_data)
            assert serializer2.is_valid(), serializer2.errors

            # This should raise ValidationError due to conflict
            with pytest.raises(Exception) as exc_info:
                serializer2.save(client=client_user_2)

            # Check that the error message mentions the conflict
            error_msg = str(exc_info.value)
            assert 'already booked' in error_msg.lower() or 'conflict' in error_msg.lower()


@pytest.mark.django_db(transaction=True)
class TestConcurrentBookingRaceCondition:
    """
    Advanced tests for race conditions using threading.
    NOTE: These tests are more complex and may be flaky in some test environments.
    """

    def test_concurrent_requests_simulation(self, trainer_profile, client_user_1, client_user_2):
        """
        Simulate two concurrent booking requests.
        Only one should succeed.

        NOTE: This is a simplified simulation. Real concurrent testing would
        require tools like pytest-xdist or integration tests.
        """
        from bookings.serializers import BookingCreateSerializer
        from rest_framework.exceptions import ValidationError

        tomorrow = date.today() + timedelta(days=1)
        booking_data = {
            'trainer': trainer_profile.id,
            'session_date': tomorrow,
            'start_time': time(10, 0),
            'end_time': time(11, 0),
            'duration_minutes': 60,
            'location_address': 'Test Gym',
        }

        results = {'success': 0, 'failed': 0}

        def attempt_booking(client_user, results_dict):
            """Attempt to create a booking"""
            try:
                from django.db import transaction
                with transaction.atomic():
                    serializer = BookingCreateSerializer(data=booking_data)
                    if serializer.is_valid():
                        serializer.save(client=client_user)
                        results_dict['success'] += 1
            except (ValidationError, Exception):
                results_dict['failed'] += 1

        # In a real concurrent scenario, these would run simultaneously
        # For this test, we run them sequentially to verify the logic
        attempt_booking(client_user_1, results)
        attempt_booking(client_user_2, results)

        # Verify: exactly one should succeed, one should fail
        assert results['success'] == 1, f"Expected 1 success, got {results['success']}"
        assert results['failed'] == 1, f"Expected 1 failure, got {results['failed']}"

        # Verify only one booking exists in database
        bookings = Booking.objects.filter(
            trainer=trainer_profile,
            session_date=tomorrow,
            start_time=time(10, 0)
        )
        assert bookings.count() == 1, "Only one booking should exist"


@pytest.mark.skip(reason="Index test is environment-specific - verify manually in production")
def test_booking_indexes_exist(db):
    """Verify that proper database indexes exist for performance"""
    from django.db import connection

    # Get table name
    table_name = Booking._meta.db_table

    # Get indexes
    with connection.cursor() as cursor:
        # This query works for PostgreSQL
        cursor.execute(f"""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = '{table_name}';
        """)
        indexes = cursor.fetchall()

    index_names = [idx[0] for idx in indexes]

    # Verify important indexes exist
    # Note: Index names are auto-generated by Django, so we check for partial matches
    index_found = any('trainer' in idx.lower() and 'session_date' in idx.lower()
                      for idx in index_names)
    assert index_found, f"Index on (trainer, session_date) not found. Indexes: {index_names}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
