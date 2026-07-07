# ministries/serializers.py
from rest_framework import serializers
from .models import Ministry
from members.models import Member
from members.serializers import MemberSerializer

class MinistrySerializer(serializers.ModelSerializer):
    leader_detail = MemberSerializer(source='leader', read_only=True)
    
    class Meta:
        model = Ministry
        fields = [
            'ministry_id',
            'name',
            'description',
            'leader',
            'leader_detail'
        ]
        read_only_fields = ['ministry_id']
    
    def validate_leader(self, value):
        """Validate that the leader exists"""
        if value and not Member.objects.filter(member_id=value).exists():
            raise serializers.ValidationError("Leader does not exist")
        return value