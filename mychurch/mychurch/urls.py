"""
URL configuration for mychurch project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # Custom apps
    path('api/', include('api.urls')),
    path('members/', include('members.urls')),
    path('ministries/', include('ministries.urls')),
    path('certificates/', include('certificates.urls')),
    path('chat/', include('chat.urls')),
    path('news/', include('news.urls')),
    path('histories/', include('histories.urls')),
    path('library/', include('library.urls')),
    path('', include('events.urls')),
    path('profiles/', include('profiles.urls')),
    path('roles/', include('roles.urls')),
]
