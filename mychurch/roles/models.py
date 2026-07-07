# roles/models.py
from django.db import models
import uuid
from api.models import User

class Role(models.Model):
    """
    Role model for church positions
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('pastor', 'Pastor'),
        ('elder', 'Elder'),
        ('deacon', 'Deacon'),
    ]
    
    role_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(max_length=255)
    mobile_number = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_name_display()} - {self.email}"
    
    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['-created_at']