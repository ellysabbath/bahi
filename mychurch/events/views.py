from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Event, Attendance
from .serializers import EventSerializer, AttendanceSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = []

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = []
