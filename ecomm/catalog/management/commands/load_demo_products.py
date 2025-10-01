import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from catalog.models import Product


class Command(BaseCommand):
    help = 'Load demo products from demoproducts.json file'

    def handle(self, *args, **options):
        # Get the path to the JSON file
        json_file_path = os.path.join(
            settings.BASE_DIR, 
            'catalog', 
            'demoproducts.json'
        )
        
        try:
            # Check if file exists
            if not os.path.exists(json_file_path):
                self.stdout.write(
                    self.style.ERROR(f'File not found: {json_file_path}')
                )
                return
            
            # Read the JSON file
            with open(json_file_path, 'r', encoding='utf-8') as file:
                products_data = json.load(file)
            
            # Clear existing products (optional - comment out if you want to keep existing)
            Product.objects.all().delete()
            self.stdout.write(
                self.style.WARNING('Cleared existing products from database')
            )
            
            # Create products from JSON data
            created_count = 0
            for product_data in products_data:
                try:
                    # Create the product
                    product = Product.objects.create(
                        title=product_data['title'],
                        description=product_data['description'],
                        category=product_data['category'],
                        price=product_data['price'],
                        image_url=product_data.get('image_url', ''),
                        brand=product_data.get('brand', 'Generic'),
                        color=product_data.get('color', ''),
                        material=product_data.get('material', ''),
                        available_sizes=product_data.get('available_sizes', []),
                        in_stock=product_data.get('in_stock', True),
                        rating=product_data.get('rating', 0.0),
                        num_reviews=product_data.get('num_reviews', 0)
                    )
                    created_count += 1
                    self.stdout.write(
                        f'Created product: {product.title}'
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error creating product {product_data.get("title", "Unknown")}: {str(e)}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully loaded {created_count} products from demoproducts.json'
                )
            )
            
        except json.JSONDecodeError as e:
            self.stdout.write(
                self.style.ERROR(f'Invalid JSON format: {str(e)}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Unexpected error: {str(e)}')
            ) 