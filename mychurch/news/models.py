import uuid
import base64
from django.db import models
from members.models import Member

class News(models.Model):
    news_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True)
    publish_date = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=50)
    image_base64 = models.TextField(null=True, blank=True)  # optional image/poster
