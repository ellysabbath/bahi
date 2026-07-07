# chat/views.py
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from members.models import Member
from django.db.models import Q

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = []
    
    def create(self, request, *args, **kwargs):
        """Create a new chat message"""
        try:
            print("📨 Received data:", request.data)
            
            sender_id = request.data.get('sender')
            receiver_id = request.data.get('receiver')
            chat_type = request.data.get('chat_type', 'private')
            message_text = request.data.get('message_text')
            
            # Validate sender
            if not sender_id:
                return Response(
                    {'error': 'Sender is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate message
            if not message_text or not message_text.strip():
                return Response(
                    {'error': 'Message text is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if sender exists
            try:
                sender = Member.objects.get(member_id=sender_id)
            except Member.DoesNotExist:
                return Response(
                    {'error': f'Sender with ID {sender_id} does not exist'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # For public messages, receiver is optional
            receiver = None
            if chat_type == 'private':
                if not receiver_id:
                    return Response(
                        {'error': 'Receiver is required for private messages'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                try:
                    receiver = Member.objects.get(member_id=receiver_id)
                except Member.DoesNotExist:
                    return Response(
                        {'error': f'Receiver with ID {receiver_id} does not exist'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create the message
            message = ChatMessage.objects.create(
                sender=sender,
                receiver=receiver,
                chat_type=chat_type,
                message_text=message_text.strip()
            )
            
            serializer = self.get_serializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print("❌ Error creating message:", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request, *args, **kwargs):
        """List all messages"""
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get all public messages"""
        try:
            public_messages = ChatMessage.objects.filter(chat_type='public')
            serializer = self.get_serializer(public_messages, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def between(self, request):
        """Get messages between two users"""
        try:
            user1 = request.query_params.get('user1')
            user2 = request.query_params.get('user2')
            
            if not user1 or not user2:
                return Response(
                    {'error': 'Both user1 and user2 parameters are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            messages = ChatMessage.objects.filter(
                Q(sender_id=user1, receiver_id=user2) |
                Q(sender_id=user2, receiver_id=user1)
            ).order_by('timestamp')
            
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )