import os
from pinecone import Pinecone
from django.core.management.base import BaseCommand
from django.conf import settings
from catalog.models import Product
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Command(BaseCommand):
    help = 'Generate and index semantic embeddings for all products using sentence-transformers and Pinecone'

    def handle(self, *args, **options):
        # Load Pinecone credentials from environment variables
        pinecone_api_key = os.environ.get('PINECONE_API_KEY')
        pinecone_host = os.environ.get('PINECONE_HOST')
        pinecone_index_name = os.environ.get('PINECONE_INDEX_NAME')
        
        # Check if all required environment variables are present
        if not all([pinecone_api_key, pinecone_host, pinecone_index_name]):
            self.stdout.write(
                self.style.ERROR(
                    'Missing required environment variables. Please set:\n'
                    '- PINECONE_API_KEY\n'
                    '- PINECONE_HOST\n'
                    '- PINECONE_INDEX_NAME\n\n'
                    'Make sure your .env file is in the project root directory.'
                )
            )
            return
        
        try:
            # Initialize Pinecone with new API
            self.stdout.write('Initializing Pinecone...')
            pc = Pinecone(api_key=pinecone_api_key)
            
            # Get the index object
            self.stdout.write(f'Connecting to Pinecone index: {pinecone_index_name}')
            index = pc.Index(pinecone_index_name)
            
            # Load the sentence transformer model
            self.stdout.write('Loading sentence transformer model...')
            model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Get all products from the database
            products = Product.objects.all()
            total_products = products.count()
            
            if total_products == 0:
                self.stdout.write(
                    self.style.WARNING('No products found in the database. Please load products first.')
                )
                return
            
            self.stdout.write(f'Found {total_products} products to index...')
            
            # Process each product
            indexed_count = 0
            for i, product in enumerate(products, 1):
                try:
                    # Concatenate title and description for embedding
                    text_for_embedding = f"{product.title} {product.description}"
                    
                    # Generate embedding
                    embedding = model.encode(text_for_embedding)
                    
                    # Prepare metadata
                    metadata = {
                        'title': product.title,
                        'description': product.description,
                        'category': product.category,
                        'brand': product.brand
                    }
                    
                    # Upsert to Pinecone
                    index.upsert(
                        vectors=[{
                            'id': str(product.id),
                            'values': embedding.tolist(),
                            'metadata': metadata
                        }]
                    )
                    
                    indexed_count += 1
                    self.stdout.write(f'Indexed product {i}/{total_products}: {product.title}')
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error indexing product {product.title}: {str(e)}')
                    )
            
            # Success message
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully indexed {indexed_count} out of {total_products} products to Pinecone!'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Unexpected error: {str(e)}')
            ) 