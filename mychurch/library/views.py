from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Book, BorrowRecord
from .serializers import BookSerializer, BorrowRecordSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = []

class BorrowRecordViewSet(viewsets.ModelViewSet):
    queryset = BorrowRecord.objects.all()
    serializer_class = BorrowRecordSerializer
    permission_classes = []
