# # certificates/models.py

# from django.db import models
# from members.models import Member
# from datetime import date
# import uuid
# class Certificate(models.Model):
#     # ===== HEADER SECTION =====
#     certificate_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     heading = models.CharField(max_length=200, 
#                                default="SEVENTH-DAY ADVENTIST CHURCH",
#                                help_text="Main heading displayed at top center between logo and person image")
    
#     logo_image = models.TextField(blank=True, null=True, 
#                                   help_text="Base64 encoded logo image - displayed at top-left corner")
    
#     person_image = models.TextField(blank=True, null=True, 
#                                     help_text="Base64 encoded person/recipient image - displayed at top-right corner")
    
#     # ===== CERTIFICATE BODY =====
#     person_name = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True)
    
#     POSITION_CHOICES = [
#         ('PASTOR', 'Pastor'),
#         ('ELDER', 'Church Elder'),
#         ('DEACON', 'Deacon'),
#         ('DEACONESS', 'Deaconess'),
#         ('DEPARTMENT_LEADER', 'Department Leader'),
#         ('SABBATH_SCHOOL_SUPERINTENDENT', 'Sabbath School Superintendent'),
#         ('YOUTH_LEADER', 'Youth Leader'),
#         ('CHOIR_DIRECTOR', 'Choir Director'),
#         ('COMMUNICATION_LEADER', 'Communication Leader'),
#         ('STEWARDSHIP_LEADER', 'Stewardship Leader'),
#         ('PRAYER_LEADER', 'Prayer Leader'),
#         ('MUSIC_DIRECTOR', 'Music Director'),
#         ('OTHER', 'Other'),
#     ]
    
#     position = models.CharField(max_length=50, choices=POSITION_CHOICES, 
#                                 default='PASTOR', 
#                                 help_text="Position/role of the person - displayed below person name")
    
#     other_position = models.CharField(max_length=100, blank=True, null=True, 
#                                       help_text="If 'Other' position selected")
    
#     working_time = models.CharField(max_length=100, 
#                                     default="5 years", 
#                                     help_text="Duration of service - displayed below position (e.g., '5 years', '3 months')")
    
#     # ===== SIGNATURE SECTION =====
#     signature_person = models.TextField(blank=True, null=True, 
#                                         help_text="Base64 encoded signature of the person - displayed at bottom-left")
    
#     leader_signature = models.TextField(blank=True, null=True, 
#                                         help_text="Base64 encoded signature of the church leader - displayed at bottom-right")
    
#     # ===== CERTIFICATE DETAILS =====
#     certificate_number = models.CharField(max_length=20, unique=True, blank=True)
#     issue_date = models.DateField(auto_now_add=True)
    
#     # ===== ADDITIONAL FIELDS =====
#     additional_notes = models.TextField(blank=True, null=True, 
#                                         help_text="Any additional notes or remarks - displayed below working time")
    
#     # ===== PDF STORAGE =====
#     certificate_pdf = models.TextField(blank=True, null=True, 
#                                        help_text="Base64 encoded certificate PDF - complete certificate stored here")
    
#     # ===== TIMESTAMPS =====
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     def get_display_position(self):
#         if self.position == 'OTHER' and self.other_position:
#             return self.other_position
#         return dict(self.POSITION_CHOICES).get(self.position, self.position)
    
#     def save(self, *args, **kwargs):
#         if not self.certificate_number:
#             import random
#             import datetime
#             year = datetime.datetime.now().year
#             self.certificate_number = f"SDC-{year}-{random.randint(1000, 9999)}"
#         super().save(*args, **kwargs)
    
#     def __str__(self):
#         return f"{self.certificate_number} - {self.person_name}"
    
#     class Meta:
#         ordering = ['-created_at']
#         verbose_name = "Certificate"
#         verbose_name_plural = "Certificates"





# certificates/models.py

from django.db import models
from members.models import Member
from datetime import date
import uuid

class Certificate(models.Model):
    # ===== HEADER SECTION =====
    certificate_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    heading = models.CharField(max_length=200, 
                               default="SEVENTH-DAY ADVENTIST CHURCH",
                               help_text="Main heading displayed at top center between logo and person image")
    
    logo_image = models.TextField(blank=True, null=True, 
                                  help_text="Base64 encoded logo image - displayed at top-left corner")
    
    person_image = models.TextField(blank=True, null=True, 
                                    help_text="Base64 encoded person/recipient image - displayed at top-right corner")
    
    # ===== CERTIFICATE BODY =====
    person_name = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='certificates')
    
    POSITION_CHOICES = [
        ('PASTOR', 'Pastor'),
        ('ELDER', 'Church Elder'),
        ('DEACON', 'Deacon'),
        ('DEACONESS', 'Deaconess'),
        ('DEPARTMENT_LEADER', 'Department Leader'),
        ('SABBATH_SCHOOL_SUPERINTENDENT', 'Sabbath School Superintendent'),
        ('YOUTH_LEADER', 'Youth Leader'),
        ('CHOIR_DIRECTOR', 'Choir Director'),
        ('COMMUNICATION_LEADER', 'Communication Leader'),
        ('STEWARDSHIP_LEADER', 'Stewardship Leader'),
        ('PRAYER_LEADER', 'Prayer Leader'),
        ('MUSIC_DIRECTOR', 'Music Director'),
        ('OTHER', 'Other'),
    ]
    
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, 
                                default='PASTOR', 
                                help_text="Position/role of the person - displayed below person name")
    
    other_position = models.CharField(max_length=100, blank=True, null=True, 
                                      help_text="If 'Other' position selected")
    
    working_time = models.CharField(max_length=100, 
                                    default="5 years", 
                                    help_text="Duration of service - displayed below position (e.g., '5 years', '3 months')")
    
    # ===== SIGNATURE SECTION =====
    signature_person = models.TextField(blank=True, null=True, 
                                        help_text="Base64 encoded signature of the person - displayed at bottom-left")
    
    leader_signature = models.TextField(blank=True, null=True, 
                                        help_text="Base64 encoded signature of the church leader - displayed at bottom-right")
    
    # ===== CERTIFICATE DETAILS =====
    certificate_number = models.CharField(max_length=20, unique=True, blank=True)
    issue_date = models.DateField(auto_now_add=True)
    
    # ===== ADDITIONAL FIELDS =====
    additional_notes = models.TextField(blank=True, null=True, 
                                        help_text="Any additional notes or remarks - displayed below working time")
    
    # ===== PDF STORAGE =====
    certificate_pdf = models.TextField(blank=True, null=True, 
                                       help_text="Base64 encoded certificate PDF - complete certificate stored here")
    
    # ===== TIMESTAMPS =====
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_display_position(self):
        if self.position == 'OTHER' and self.other_position:
            return self.other_position
        return dict(self.POSITION_CHOICES).get(self.position, self.position)
    
    def save(self, *args, **kwargs):
        if not self.certificate_number:
            import random
            import datetime
            year = datetime.datetime.now().year
            self.certificate_number = f"SDC-{year}-{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.certificate_number} - {self.person_name}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Certificate"
        verbose_name_plural = "Certificates"