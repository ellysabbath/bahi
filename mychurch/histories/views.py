# history/views.py
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import History
from .serializers import HistorySerializer, HistoryCreateUpdateSerializer

class HistoryViewSet(viewsets.ModelViewSet):
    queryset = History.objects.all()
    permission_classes = [AllowAny]  # Or [IsAuthenticated] for authenticated access
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HistoryCreateUpdateSerializer
        return HistorySerializer
    
    def list(self, request, *args, **kwargs):
        """List all history records"""
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """Create a new history record"""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                history = serializer.save()
                full_serializer = HistorySerializer(history)
                return Response(full_serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Get a specific history record"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        """Update a history record"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                history = serializer.save()
                full_serializer = HistorySerializer(history)
                return Response(full_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a history record"""
        try:
            instance = self.get_object()
            instance.delete()
            return Response(
                {'message': 'History record deleted successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent history records (last 10)"""
        try:
            recent_histories = History.objects.all()[:10]
            serializer = HistorySerializer(recent_histories, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """Get history records by date range"""
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            queryset = History.objects.all()
            
            if start_date:
                queryset = queryset.filter(event_date__gte=start_date)
            if end_date:
                queryset = queryset.filter(event_date__lte=end_date)
            
            serializer = HistorySerializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )