from django.urls import path
from .views import EditImageView

urlpatterns = [
    path('edit-image', EditImageView.as_view())
]
