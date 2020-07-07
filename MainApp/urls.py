from django.urls import path

from . import views

urlpatterns = [
    path('', views.project_intro, name='project_intro'),
    path('project_intro/', views.project_intro, name='project_intro'),
    path('about/', views.about, name='about'),
    path('about_workshop/', views.about_workshop, name='about_workshop'),
    path('viz1/', views.viz1, name='viz1'),
    path('get_word_cloud/', views.get_word_cloud, name='get_word_cloud'),
    path('word_cloud/', views.word_cloud, name='word_cloud'),
    # path('viz2/', views.viz2, name='viz2'),
    path('submit/', views.submit, name='submit'),
    path('fear_items/', views.fear_items, name='fear_items'),
    path('submit_one/', views.submit_one, name='submit_one'),
    path('workshop/', views.submit_workshop, name='submit_workshop'),
    path('viz/', views.viz, name='viz'),
    path('submit_consent/', views.submit_consent, name='submit_consent'),
    path('submit_images/', views.submit_images, name='submit_images'),
    path('complete_submission/', views.complete_submission, name='complete_submission'),
    path('delete_entry/', views.delete_entry, name='delete_entry'),
]
