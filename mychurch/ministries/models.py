import uuid
from django.db import models
from members.models import Member

class Ministry(models.Model):
    ministry_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    leader = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True)
