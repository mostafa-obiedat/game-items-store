import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create the demo account used to sign in to the store."

    def handle(self, *args, **options):
        username = os.getenv("DEMO_USERNAME", "demo")
        password = os.getenv("DEMO_PASSWORD", "demo1234")

        User = get_user_model()
        user, created = User.objects.get_or_create(username=username)
        # Reset the password every run so the credentials in the README always work.
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} demo account '{username}'."))
