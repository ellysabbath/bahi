from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Ministry
from .serializers import MinistrySerializer

class MinistryViewSet(viewsets.ModelViewSet):
    queryset = Ministry.objects.all()
    serializer_class = MinistrySerializer
    permission_classes = []
