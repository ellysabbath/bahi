# roles/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet

app_name = 'roles'

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')

urlpatterns = [
    path('', include(router.urls)),
]