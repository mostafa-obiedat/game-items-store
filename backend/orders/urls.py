from django.urls import path

from .views import OrderCreateView, OrderDetailView

urlpatterns = [
    path("", OrderCreateView.as_view(), name="order-create"),
    path("<uuid:reference>/", OrderDetailView.as_view(), name="order-detail"),
]
