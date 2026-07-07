# certificates/serializers.py

from rest_framework import serializers
from .models import Certificate
from members.models import Member

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['member_id', 'first_name', 'last_name', 'membership_status']

class CertificateSerializer(serializers.ModelSerializer):
    person_name = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all())
    person_name_detail = MemberSerializer(source='person_name', read_only=True)
    display_position = serializers.CharField(source='get_display_position', read_only=True)
    
    class Meta:
        model = Certificate
        fields = [
            'certificate_id',
            'certificate_number',
            'heading',
            'logo_image',
            'person_image',
            'person_name',
            'person_name_detail',
            'position',
            'other_position',
            'display_position',
            'working_time',
            'signature_person',
            'leader_signature',
            'issue_date',
            'additional_notes',
            'certificate_pdf',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['certificate_id', 'certificate_number', 'issue_date', 'created_at', 'updated_at']

class CertificateCreateUpdateSerializer(serializers.ModelSerializer):
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
            'additional_notes'
        ]