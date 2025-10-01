from django.urls import path, include
from .views import home_page, ProductViewSet, chat_endpoint, product_detail
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'products', ProductViewSet)

urlpatterns = [
    path('', home_page, name='home'),
    path('products/<int:product_id>/', product_detail, name='product_detail'),
    path('', include(router.urls)),
    path('chat/', chat_endpoint, name='chat'),
] 