from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('submit', views.submit, name='submit'),
    path('submit_consent', views.submit_consent, name='submit_consent'),
    path('submit_images', views.submit_images, name='submit_images'),
]
