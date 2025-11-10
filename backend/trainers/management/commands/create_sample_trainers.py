"""
Management command to create sample trainer profiles for testing
Usage: python manage.py create_sample_trainers
"""
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from users.models import User
from trainers.models import TrainerProfile, Specialization
import random


class Command(BaseCommand):
    help = 'Creates sample trainer profiles for testing search functionality'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample trainers...')

        # Sample data
        locations = [
            {'city': 'San Francisco', 'state': 'CA', 'lat': 37.7749, 'lng': -122.4194},
            {'city': 'Los Angeles', 'state': 'CA', 'lat': 34.0522, 'lng': -118.2437},
            {'city': 'New York', 'state': 'NY', 'lat': 40.7128, 'lng': -74.0060},
            {'city': 'Chicago', 'state': 'IL', 'lat': 41.8781, 'lng': -87.6298},
            {'city': 'Miami', 'state': 'FL', 'lat': 25.7617, 'lng': -80.1918},
            {'city': 'Austin', 'state': 'TX', 'lat': 30.2672, 'lng': -97.7431},
            {'city': 'Seattle', 'state': 'WA', 'lat': 47.6062, 'lng': -122.3321},
            {'city': 'Denver', 'state': 'CO', 'lat': 39.7392, 'lng': -104.9903},
        ]

        trainer_data = [
            {
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'bio': 'NASM certified personal trainer with 8 years of experience helping clients achieve their fitness goals. Specializing in strength training and weight loss.',
                'years_experience': 8,
                'hourly_rate': '75.00',
            },
            {
                'first_name': 'Mike',
                'last_name': 'Chen',
                'bio': 'Former college athlete turned personal trainer. I focus on functional fitness and sports performance training.',
                'years_experience': 5,
                'hourly_rate': '65.00',
            },
            {
                'first_name': 'Jessica',
                'last_name': 'Martinez',
                'bio': 'Yoga instructor and wellness coach. I help clients find balance through mindful movement and breathwork.',
                'years_experience': 10,
                'hourly_rate': '80.00',
            },
            {
                'first_name': 'David',
                'last_name': 'Williams',
                'bio': 'CrossFit Level 2 trainer with a passion for high-intensity workouts. Let\'s push your limits together!',
                'years_experience': 6,
                'hourly_rate': '70.00',
            },
            {
                'first_name': 'Emily',
                'last_name': 'Brown',
                'bio': 'Certified nutritionist and personal trainer. I take a holistic approach to health and fitness.',
                'years_experience': 7,
                'hourly_rate': '85.00',
            },
            {
                'first_name': 'James',
                'last_name': 'Taylor',
                'bio': 'Former Navy SEAL turned fitness coach. Specializing in functional strength and endurance training.',
                'years_experience': 12,
                'hourly_rate': '95.00',
            },
            {
                'first_name': 'Amanda',
                'last_name': 'Garcia',
                'bio': 'Pilates instructor with a focus on core strength and flexibility. Perfect for beginners and advanced students.',
                'years_experience': 4,
                'hourly_rate': '60.00',
            },
            {
                'first_name': 'Chris',
                'last_name': 'Lee',
                'bio': 'Sports performance coach working with athletes of all levels. Let\'s take your game to the next level!',
                'years_experience': 9,
                'hourly_rate': '90.00',
            },
        ]

        # Get all specializations
        specializations = list(Specialization.objects.all())

        if not specializations:
            self.stdout.write(self.style.ERROR('No specializations found. Please create specializations first.'))
            return

        created_count = 0

        for i, data in enumerate(trainer_data):
            # Use location data, cycling through locations
            location_data = locations[i % len(locations)]

            # Create user
            email = f"{data['first_name'].lower()}.{data['last_name'].lower()}@fitconnect.com"
            username = f"{data['first_name'].lower()}{data['last_name'].lower()}"

            # Skip if user already exists
            if User.objects.filter(email=email).exists():
                self.stdout.write(f'User {email} already exists, skipping...')
                continue

            user = User.objects.create_user(
                email=email,
                username=username,
                password='password123',  # Simple password for testing
                first_name=data['first_name'],
                last_name=data['last_name'],
                role='trainer',
                email_verified=True  # Mark as verified for testing
            )

            # Create trainer profile
            address = f"{random.randint(100, 999)} Main St, {location_data['city']}, {location_data['state']} {random.randint(10000, 99999)}"
            location_point = Point(location_data['lng'], location_data['lat'], srid=4326)

            profile = TrainerProfile.objects.create(
                user=user,
                bio=data['bio'],
                years_experience=data['years_experience'],
                address=address,
                location=location_point,
                hourly_rate=data['hourly_rate'],
                verified=random.choice([True, True, False]),  # 2/3 chance of being verified
                average_rating=round(random.uniform(4.0, 5.0), 2),
                total_reviews=random.randint(5, 50),
                profile_complete=True,
                published=True  # Make visible in search
            )

            # Add 2-4 random specializations
            num_specs = random.randint(2, min(4, len(specializations)))
            selected_specs = random.sample(specializations, num_specs)
            profile.specializations.set(selected_specs)

            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created trainer: {data["first_name"]} {data["last_name"]} in {location_data["city"]}, {location_data["state"]}'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully created {created_count} trainer profiles!')
        )
        self.stdout.write('\nYou can now search for trainers using the search page.')
        self.stdout.write('Test credentials: email@fitconnect.com / password123')
