# # certificates/views.py

# from django.shortcuts import render, get_object_or_404, redirect
# from django.contrib import messages
# from django.http import HttpResponse, JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from .models import Certificate
# from .forms import CertificateForm
# from .utils import generate_certificate_pdf, convert_pdf_to_base64
# import base64

# # ✅ Make sure this function exists
# def certificate_list(request):
#     """List all certificates"""
#     certificates = Certificate.objects.all()
#     return render(request, 'list.html', {'certificates': certificates})

# # ✅ Make sure this function exists
# def certificate_create(request):
#     """Create a new certificate"""
#     if request.method == 'POST':
#         form = CertificateForm(request.POST, request.FILES)
#         if form.is_valid():
#             certificate = form.save(commit=False)
            
#             # Process uploaded images
#             if 'logo_file' in request.FILES:
#                 logo_file = request.FILES['logo_file']
#                 logo_base64 = convert_image_to_base64(logo_file)
#                 certificate.logo_image = logo_base64
            
#             if 'person_image_file' in request.FILES:
#                 person_file = request.FILES['person_image_file']
#                 person_base64 = convert_image_to_base64(person_file)
#                 certificate.person_image = person_base64
            
#             if 'signature_person_file' in request.FILES:
#                 sig_file = request.FILES['signature_person_file']
#                 sig_base64 = convert_image_to_base64(sig_file)
#                 certificate.signature_person = sig_base64
            
#             if 'leader_signature_file' in request.FILES:
#                 leader_file = request.FILES['leader_signature_file']
#                 leader_base64 = convert_image_to_base64(leader_file)
#                 certificate.leader_signature = leader_base64
            
#             certificate.save()
            
#             # Generate PDF
#             pdf_buffer = generate_certificate_pdf(certificate)
#             base64_pdf = convert_pdf_to_base64(pdf_buffer)
            
#             # Save PDF to certificate
#             certificate.certificate_pdf = base64_pdf
#             certificate.save()
            
#             messages.success(request, f'Certificate created successfully! Certificate No: {certificate.certificate_number}')
#             return redirect('certificates:certificate_detail', pk=certificate.pk)
#     else:
#         form = CertificateForm()
    
#     return render(request, 'create.html', {'form': form})

# # ✅ Make sure this function exists
# def certificate_detail(request, pk):
#     """View certificate details"""
#     certificate = get_object_or_404(Certificate, pk=pk)
#     return render(request, 'detail.html', {'certificate': certificate})

# # ✅ Make sure this function exists
# def certificate_edit(request, pk):
#     """Edit certificate"""
#     certificate = get_object_or_404(Certificate, pk=pk)
    
#     if request.method == 'POST':
#         form = CertificateForm(request.POST, request.FILES, instance=certificate)
#         if form.is_valid():
#             certificate = form.save(commit=False)
            
#             # Process uploaded images
#             if 'logo_file' in request.FILES:
#                 logo_file = request.FILES['logo_file']
#                 logo_base64 = convert_image_to_base64(logo_file)
#                 certificate.logo_image = logo_base64
            
#             if 'person_image_file' in request.FILES:
#                 person_file = request.FILES['person_image_file']
#                 person_base64 = convert_image_to_base64(person_file)
#                 certificate.person_image = person_base64
            
#             if 'signature_person_file' in request.FILES:
#                 sig_file = request.FILES['signature_person_file']
#                 sig_base64 = convert_image_to_base64(sig_file)
#                 certificate.signature_person = sig_base64
            
#             if 'leader_signature_file' in request.FILES:
#                 leader_file = request.FILES['leader_signature_file']
#                 leader_base64 = convert_image_to_base64(leader_file)
#                 certificate.leader_signature = leader_base64
            
#             certificate.save()
            
#             # Regenerate PDF
#             pdf_buffer = generate_certificate_pdf(certificate)
#             base64_pdf = convert_pdf_to_base64(pdf_buffer)
#             certificate.certificate_pdf = base64_pdf
#             certificate.save()
            
#             messages.success(request, 'Certificate updated successfully!')
#             return redirect('certificates:certificate_detail', pk=certificate.pk)
#     else:
#         form = CertificateForm(instance=certificate)
    
#     return render(request, 'edit.html', {'form': form, 'certificate': certificate})

# # ✅ Make sure this function exists
# def certificate_delete(request, pk):
#     """Delete certificate"""
#     certificate = get_object_or_404(Certificate, pk=pk)
    
#     if request.method == 'POST':
#         certificate.delete()
#         messages.success(request, 'Certificate deleted successfully!')
#         return redirect('certificates:certificate_list')
    
#     return render(request, 'delete.html', {'certificate': certificate})

# # ✅ Make sure this function exists
# def certificate_preview(request, pk):
#     """Preview certificate as PDF"""
#     certificate = get_object_or_404(Certificate, pk=pk)
    
#     pdf_buffer = generate_certificate_pdf(certificate)
#     response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
#     response['Content-Disposition'] = f'inline; filename=certificate_{certificate.certificate_number}.pdf'
#     return response

# # ✅ Make sure this function exists
# def certificate_download(request, pk):
#     """Download certificate as PDF"""
#     certificate = get_object_or_404(Certificate, pk=pk)
    
#     pdf_buffer = generate_certificate_pdf(certificate)
#     response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
#     response['Content-Disposition'] = f'attachment; filename=certificate_{certificate.certificate_number}.pdf'
#     return response

# # Helper function to convert image to Base64
# def convert_image_to_base64(image_file):
#     """Convert uploaded image file to Base64 string"""
#     try:
#         image_data = image_file.read()
#         base64_image = base64.b64encode(image_data).decode('utf-8')
#         content_type = image_file.content_type or 'image/png'
#         return f"data:{content_type};base64,{base64_image}"
#     except Exception as e:
#         return None

# # API endpoints
# @csrf_exempt
# def certificate_generate_pdf_api(request, pk):
#     """API endpoint to generate PDF"""
#     certificate = get_object_or_404(Certificate, pk=pk)
#     pdf_buffer = generate_certificate_pdf(certificate)
#     base64_pdf = convert_pdf_to_base64(pdf_buffer)
    
#     certificate.certificate_pdf = base64_pdf
#     certificate.save()
    
#     return JsonResponse({
#         'success': True,
#         'certificate_number': certificate.certificate_number,
#         'pdf_base64': base64_pdf
#     })

# @csrf_exempt
# def certificate_upload_image_api(request):
#     """API to upload and convert image to Base64"""
#     if request.method == 'POST' and request.FILES.get('image'):
#         image_file = request.FILES['image']
#         import base64
#         image_data = image_file.read()
#         base64_image = base64.b64encode(image_data).decode('utf-8')
        
#         # Determine image type
#         content_type = image_file.content_type or 'image/png'
#         base64_string = f"data:{content_type};base64,{base64_image}"
        
#         return JsonResponse({
#             'success': True,
#             'base64': base64_string
#         })
    
#     return JsonResponse({'success': False, 'error': 'No image uploaded'})





# certificates/views.py

from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import HttpResponse
from .models import Certificate
from .serializers import CertificateSerializer, CertificateCreateUpdateSerializer
from .utils import generate_certificate_pdf, convert_pdf_to_base64, convert_image_to_base64
import base64

class CertificateViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for CRUD operations on certificates
    """
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny] 
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CertificateCreateUpdateSerializer
        return CertificateSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new certificate"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        certificate = serializer.save()
        
        # Process uploaded images if any
        self._process_uploaded_images(certificate, request)
        
        # Generate PDF
        pdf_buffer = generate_certificate_pdf(certificate)
        base64_pdf = convert_pdf_to_base64(pdf_buffer)
        certificate.certificate_pdf = base64_pdf
        certificate.save()
        
        # Return the created certificate with details
        response_serializer = CertificateSerializer(certificate)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update a certificate"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        certificate = serializer.save()
        
        # Process uploaded images if any
        self._process_uploaded_images(certificate, request)
        
        # Regenerate PDF
        pdf_buffer = generate_certificate_pdf(certificate)
        base64_pdf = convert_pdf_to_base64(pdf_buffer)
        certificate.certificate_pdf = base64_pdf
        certificate.save()
        
        response_serializer = CertificateSerializer(certificate)
        return Response(response_serializer.data)
    
    def _process_uploaded_images(self, certificate, request):
        """Helper method to process uploaded images"""
        # Process logo image
        if 'logo_image_file' in request.FILES:
            logo_file = request.FILES['logo_image_file']
            logo_base64 = convert_image_to_base64(logo_file)
            certificate.logo_image = logo_base64
        
        # Process person image
        if 'person_image_file' in request.FILES:
            person_file = request.FILES['person_image_file']
            person_base64 = convert_image_to_base64(person_file)
            certificate.person_image = person_base64
        
        # Process signature (person)
        if 'signature_person_file' in request.FILES:
            sig_file = request.FILES['signature_person_file']
            sig_base64 = convert_image_to_base64(sig_file)
            certificate.signature_person = sig_base64
        
        # Process leader signature
        if 'leader_signature_file' in request.FILES:
            leader_file = request.FILES['leader_signature_file']
            leader_base64 = convert_image_to_base64(leader_file)
            certificate.leader_signature = leader_base64
        
        certificate.save()
    
    @action(detail=True, methods=['get'])
    def preview_pdf(self, request, pk=None):
        """Preview certificate as PDF"""
        certificate = self.get_object()
        pdf_buffer = generate_certificate_pdf(certificate)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename=certificate_{certificate.certificate_number}.pdf'
        return response
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download certificate as PDF"""
        certificate = self.get_object()
        pdf_buffer = generate_certificate_pdf(certificate)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=certificate_{certificate.certificate_number}.pdf'
        return response
    
    @action(detail=True, methods=['post'])
    def regenerate_pdf(self, request, pk=None):
        """Regenerate certificate PDF"""
        certificate = self.get_object()
        pdf_buffer = generate_certificate_pdf(certificate)
        base64_pdf = convert_pdf_to_base64(pdf_buffer)
        certificate.certificate_pdf = base64_pdf
        certificate.save()
        
        return Response({
            'success': True,
            'certificate_number': certificate.certificate_number,
            'message': 'PDF regenerated successfully'
        })