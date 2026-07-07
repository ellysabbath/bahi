# chat/models.py
import uuid
from django.db import models
from members.models import Member

class ChatMessage(models.Model):
    CHAT_TYPES = [
        ('private', 'Private Message'),
        ('public', 'Public Message'),
    ]
    
    chat_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(Member, related_name="sent_messages", on_delete=models.CASCADE)
    receiver = models.ForeignKey(Member, related_name="received_messages", on_delete=models.CASCADE, null=True, blank=True)
    chat_type = models.CharField(max_length=20, choices=CHAT_TYPES, default='private')
    message_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="sent")
    
    def __str__(self):
        if self.chat_type == 'public':
            return f"Public message from {self.sender}"
        return f"Message from {self.sender} to {self.receiver}"
    
    class Meta:
        ordering = ['timestamp']