from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Member
from .serializers import MemberSerializer

class MemberViewSet(viewsets.ModelViewSet):
    # queryset = Member.objects.all()
    queryset = Member.objects.all().order_by('first_name', 'last_name')  # Add ordering
    serializer_class = MemberSerializer
    permission_classes = []  # no restrictions
