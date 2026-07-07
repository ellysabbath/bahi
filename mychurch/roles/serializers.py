# roles/serializers.py
from rest_framework import serializers
from .models import Role

class RoleSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Role
        fields = [
            'role_id',
            'name',
            'display_name',
            'email',
            'mobile_number',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['role_id', 'created_at', 'updated_at']

class RoleCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            'name',
            'email',
            'mobile_number',
            'is_active'
        ]