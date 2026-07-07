# certificates/forms.py

from django import forms
from .models import Certificate

class CertificateForm(forms.ModelForm):
    # Add file upload fields
    logo_file = forms.FileField(
        required=False,
        label='Logo Image',
        help_text='Upload logo image (will appear top-left)',
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )
    
    person_image_file = forms.FileField(
        required=False,
        label='Person Photo',
        help_text='Upload person/recipient image (will appear top-right)',
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )
    
    signature_person_file = forms.FileField(
        required=False,
        label="Person's Signature",
        help_text='Upload signature of the recipient (bottom-left)',
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )
    
    leader_signature_file = forms.FileField(
        required=False,
        label="Leader's Signature",
        help_text='Upload signature of the church leader (bottom-right)',
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )
    
    class Meta:
        model = Certificate
        fields = [
            'heading',
            'logo_image',
            'person_image',
            'person_name',
            'position',
            'other_position',
            'working_time',
            'signature_person',
            'leader_signature',
            'additional_notes',
        ]
        widgets = {
            'heading': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter certificate heading'
            }),
            'logo_image': forms.HiddenInput(),  # Hidden field for Base64
            'person_image': forms.HiddenInput(),  # Hidden field for Base64
            'signature_person': forms.HiddenInput(),  # Hidden field for Base64
            'leader_signature': forms.HiddenInput(),  # Hidden field for Base64
            'person_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter full name'
            }),
            'position': forms.Select(attrs={
                'class': 'form-control'
            }),
            'other_position': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter other position'
            }),
            'working_time': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g., 5 years, 3 months'
            }),
            'additional_notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Additional notes (optional)'
            }),
        }