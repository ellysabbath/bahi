# roles/views.py
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Role
from .serializers import RoleSerializer, RoleCreateUpdateSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = []  # No authentication required
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RoleCreateUpdateSerializer
        return RoleSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new role"""
        try:
            print("📝 Creating role with data:", request.data)
            
            # Check if role with same email already exists
            email = request.data.get('email')
            if email and Role.objects.filter(email=email).exists():
                return Response(
                    {'error': 'A role with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                role = serializer.save()
                full_serializer = RoleSerializer(role)
                return Response(full_serializer.data, status=status.HTTP_201_CREATED)
            
            print("❌ Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print("❌ Error creating role:", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request, *args, **kwargs):
        """List all roles"""
        try:
            queryset = self.get_queryset()
            
            # Filter by role name if provided
            role_name = request.query_params.get('role')
            if role_name:
                queryset = queryset.filter(name=role_name)
            
            # Filter by active status if provided
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """Get a specific role"""
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
        """Update a role"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Check if email is being changed and already exists
            email = request.data.get('email')
            if email and Role.objects.filter(email=email).exclude(role_id=instance.role_id).exists():
                return Response(
                    {'error': 'A role with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                role = serializer.save()
                full_serializer = RoleSerializer(role)
                return Response(full_serializer.data)
            
            print("❌ Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print("❌ Error updating role:", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a role (hard delete)"""
        try:
            instance = self.get_object()
            instance.delete()
            return Response(
                {'message': 'Role deleted successfully'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about roles"""
        try:
            stats = {}
            for choice in Role.ROLE_CHOICES:
                role_name = choice[0]
                stats[role_name] = {
                    'label': choice[1],
                    'total': Role.objects.filter(name=role_name).count(),
                    'active': Role.objects.filter(name=role_name, is_active=True).count(),
                    'inactive': Role.objects.filter(name=role_name, is_active=False).count()
                }
            
            return Response({
                'total_roles': Role.objects.count(),
                'active_roles': Role.objects.filter(is_active=True).count(),
                'inactive_roles': Role.objects.filter(is_active=False).count(),
                'by_role': stats
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple roles at once"""
        try:
            data = request.data
            if not isinstance(data, list):
                return Response(
                    {'error': 'Expected a list of roles'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            created_roles = []
            errors = []
            
            for idx, role_data in enumerate(data):
                try:
                    serializer = self.get_serializer(data=role_data)
                    if serializer.is_valid():
                        role = serializer.save()
                        created_roles.append(RoleSerializer(role).data)
                    else:
                        errors.append({
                            'index': idx,
                            'errors': serializer.errors
                        })
                except Exception as e:
                    errors.append({
                        'index': idx,
                        'error': str(e)
                    })
            
            return Response({
                'created': created_roles,
                'errors': errors,
                'total_created': len(created_roles),
                'total_errors': len(errors)
            }, status=status.HTTP_201_CREATED if created_roles else status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )