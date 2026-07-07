# # certificates/urls.py

# from django.urls import path
# from . import views

# app_name = 'certificates'  # ✅ This is important for namespacing

# urlpatterns = [
#     # List all certificates (Home page)
#     path('', views.certificate_list, name='certificate_list'),
    
#     # Create new certificate
#     path('create/', views.certificate_create, name='certificate_create'),
    
#     # Certificate detail view
#     path('<int:pk>/', views.certificate_detail, name='certificate_detail'),
    
#     # Edit certificate
#     path('<int:pk>/edit/', views.certificate_edit, name='certificate_edit'),
    
#     # Delete certificate
#     path('<int:pk>/delete/', views.certificate_delete, name='certificate_delete'),
    
#     # Preview PDF
#     path('<int:pk>/preview/', views.certificate_preview, name='certificate_preview'),
    
#     # Download PDF
#     path('<int:pk>/download/', views.certificate_download, name='certificate_download'),
    
#     # API endpoints
#     path('api/<int:pk>/generate-pdf/', views.certificate_generate_pdf_api, name='generate_pdf_api'),
#     path('api/upload-image/', views.certificate_upload_image_api, name='upload_image_api'),
# ]



# certificates/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'certificates'

router = DefaultRouter()
router.register(r'certificates', views.CertificateViewSet, basename='certificate')

urlpatterns = [
    path('', include(router.urls)),
]