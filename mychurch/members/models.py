import uuid
from django.db import models

class Member(models.Model):
    member_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    contact_info = models.TextField()
    membership_status = models.CharField(max_length=50)
