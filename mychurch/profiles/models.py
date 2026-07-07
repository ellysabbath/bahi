import uuid
import base64
from django.db import models
from members.models import Member

class Profile(models.Model):
    profile_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name="profile")
    profile_picture_base64 = models.TextField(null=True, blank=True)  # store image as base64 string
    bio = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    def set_profile_picture(self, file_bytes):
        """Convert file bytes to base64 string and save"""
        self.profile_picture_base64 = base64.b64encode(file_bytes).decode('utf-8')

    def get_profile_picture(self):
        """Return base64 string for rendering"""
        return self.profile_picture_base64
