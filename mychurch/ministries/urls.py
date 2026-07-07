from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MinistryViewSet

router = DefaultRouter()
router.register(r'', MinistryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
