import uuid
import base64
from django.db import models
from members.models import Member
from ministries.models import Ministry

class Event(models.Model):
    event_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField()
    location = models.CharField(max_length=200)
    ministry = models.ForeignKey(Ministry, on_delete=models.SET_NULL, null=True)
    poster_base64 = models.TextField(null=True, blank=True)   # poster for upcoming event
    memories_base64 = models.TextField(null=True, blank=True) # photo(s) from past event

class Attendance(models.Model):
    attendance_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default="present")
