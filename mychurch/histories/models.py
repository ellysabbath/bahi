# history/models.py
import uuid
from django.db import models
from members.models import Member

class History(models.Model):
    history_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, default='Untitled', help_text='Title of the history event')
    event_description = models.TextField(help_text='Description of the event')
    event_date = models.DateField(help_text='Date when the event occurred')
    history_image = models.TextField(null=True, blank=True, help_text='Base64 encoded image of the history event')
    notes = models.TextField(null=True, blank=True, help_text='Additional notes about the event')
    created_at = models.DateTimeField(auto_now_add=True, null=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'history'
        verbose_name = 'History'
        verbose_name_plural = 'Histories'
        ordering = ['-event_date']