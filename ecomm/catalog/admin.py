from django.contrib import admin
from .models import Product

# Register your models here.

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category', 'brand', 'price', 'in_stock', 'rating', 'num_reviews']
    list_filter = ['category', 'brand', 'in_stock', 'rating']
    search_fields = ['title', 'description', 'brand']
    list_editable = ['price', 'in_stock']
    readonly_fields = ['id', 'rating', 'num_reviews']
