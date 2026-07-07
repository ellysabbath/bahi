# history/serializers.py
from rest_framework import serializers
from .models import History

class HistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = [
            'history_id',
            'title',
            'event_description',
            'event_date',
            'history_image',
            'notes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['history_id', 'created_at', 'updated_at']

class HistoryCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = [
            'title',
            'event_description',
            'event_date',
            'history_image',
            'notes'
        ]