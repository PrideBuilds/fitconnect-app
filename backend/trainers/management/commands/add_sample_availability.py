from django.core.management.base import BaseCommand
from trainers.models import TrainerProfile, AvailabilitySlot
import random


class Command(BaseCommand):
    help = 'Adds sample availability slots for existing trainers'

    def handle(self, *args, **options):
        trainers = TrainerProfile.objects.all()

        if not trainers.exists():
            self.stdout.write(self.style.ERROR('No trainers found. Run create_sample_trainers first.'))
            return

        # Common availability patterns
        patterns = [
            # Full-time trainer (Mon-Fri, 6am-8pm)
            [
                {'day': 0, 'start': '06:00', 'end': '12:00'},
                {'day': 0, 'start': '14:00', 'end': '20:00'},
                {'day': 1, 'start': '06:00', 'end': '12:00'},
                {'day': 1, 'start': '14:00', 'end': '20:00'},
                {'day': 2, 'start': '06:00', 'end': '12:00'},
                {'day': 2, 'start': '14:00', 'end': '20:00'},
                {'day': 3, 'start': '06:00', 'end': '12:00'},
                {'day': 3, 'start': '14:00', 'end': '20:00'},
                {'day': 4, 'start': '06:00', 'end': '12:00'},
                {'day': 4, 'start': '14:00', 'end': '20:00'},
            ],
            # Weekend warrior (Sat-Sun mornings)
            [
                {'day': 5, 'start': '07:00', 'end': '13:00'},
                {'day': 6, 'start': '07:00', 'end': '13:00'},
            ],
            # Early bird (Mon-Fri mornings)
            [
                {'day': 0, 'start': '05:00', 'end': '10:00'},
                {'day': 1, 'start': '05:00', 'end': '10:00'},
                {'day': 2, 'start': '05:00', 'end': '10:00'},
                {'day': 3, 'start': '05:00', 'end': '10:00'},
                {'day': 4, 'start': '05:00', 'end': '10:00'},
            ],
            # Evening specialist (Mon-Sat evenings)
            [
                {'day': 0, 'start': '17:00', 'end': '21:00'},
                {'day': 1, 'start': '17:00', 'end': '21:00'},
                {'day': 2, 'start': '17:00', 'end': '21:00'},
                {'day': 3, 'start': '17:00', 'end': '21:00'},
                {'day': 4, 'start': '17:00', 'end': '21:00'},
                {'day': 5, 'start': '17:00', 'end': '21:00'},
            ],
            # Flexible schedule (All days, split shift)
            [
                {'day': 0, 'start': '08:00', 'end': '11:00'},
                {'day': 0, 'start': '16:00', 'end': '19:00'},
                {'day': 1, 'start': '08:00', 'end': '11:00'},
                {'day': 1, 'start': '16:00', 'end': '19:00'},
                {'day': 2, 'start': '08:00', 'end': '11:00'},
                {'day': 2, 'start': '16:00', 'end': '19:00'},
                {'day': 3, 'start': '08:00', 'end': '11:00'},
                {'day': 3, 'start': '16:00', 'end': '19:00'},
                {'day': 4, 'start': '08:00', 'end': '11:00'},
                {'day': 4, 'start': '16:00', 'end': '19:00'},
                {'day': 5, 'start': '10:00', 'end': '14:00'},
                {'day': 6, 'start': '10:00', 'end': '14:00'},
            ],
        ]

        created_count = 0

        for i, trainer in enumerate(trainers):
            # Clear existing availability
            AvailabilitySlot.objects.filter(trainer=trainer).delete()

            # Assign a pattern (cycle through patterns)
            pattern = patterns[i % len(patterns)]

            for slot_data in pattern:
                AvailabilitySlot.objects.create(
                    trainer=trainer,
                    day_of_week=slot_data['day'],
                    start_time=slot_data['start'],
                    end_time=slot_data['end'],
                    is_available=True
                )
                created_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Added {len(pattern)} availability slots for {trainer.user.first_name} {trainer.user.last_name}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n🎉 Successfully created {created_count} availability slots for {trainers.count()} trainers!"
            )
        )
