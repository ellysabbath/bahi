# chat/serializers.py
from rest_framework import serializers
from .models import ChatMessage
from members.models import Member

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_detail = serializers.SerializerMethodField()
    receiver_detail = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'chat_id',
            'sender',
            'sender_name',
            'sender_detail',
            'receiver',
            'receiver_name',
            'receiver_detail',
            'chat_type',
            'message_text',
            'timestamp',
            'status'
        ]
        read_only_fields = ['chat_id', 'timestamp', 'status']
    
    def get_sender_name(self, obj):
        try:
            return f"{obj.sender.first_name} {obj.sender.last_name}"
        except:
            return "Unknown"
    
    def get_receiver_name(self, obj):
        if not obj.receiver:
            return "Public Chat"
        try:
            return f"{obj.receiver.first_name} {obj.receiver.last_name}"
        except:
            return "Unknown"
    
    def get_sender_detail(self, obj):
        try:
            return {
                'member_id': str(obj.sender.member_id),
                'first_name': obj.sender.first_name,
                'last_name': obj.sender.last_name,
                'membership_status': obj.sender.membership_status
            }
        except:
            return None
    
    def get_receiver_detail(self, obj):
        if not obj.receiver:
            return {
                'member_id': 'public',
                'first_name': 'Public',
                'last_name': 'Chat',
                'membership_status': 'Public'
            }
        try:
            return {
                'member_id': str(obj.receiver.member_id),
                'first_name': obj.receiver.first_name,
                'last_name': obj.receiver.last_name,
                'membership_status': obj.receiver.membership_status
            }
        except:
            return None