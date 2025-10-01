from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Product
from .serializers import ProductSerializer
import os
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create your views here.

def home_view(request):
    """
    Main web interface view
    """
    return render(request, 'index.html')

def home_page(request):
    products = Product.objects.all()[:8]
    return render(request, 'home.html', {'products': products})

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    http_method_names = ['get']  # Exclude 'post' to disable creation
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Semantic search endpoint for products
        Usage: GET /api/products/search/?query=your_search_query&top_k=5
        """
        query = request.query_params.get('query', '')
        top_k = int(request.query_params.get('top_k', 5))
        
        if not query:
            return Response(
                {'error': 'Query parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Load Pinecone credentials
        pinecone_api_key = os.environ.get('PINECONE_API_KEY')
        pinecone_host = os.environ.get('PINECONE_HOST')
        pinecone_index_name = os.environ.get('PINECONE_INDEX_NAME')
        
        if not all([pinecone_api_key, pinecone_host, pinecone_index_name]):
            return Response(
                {'error': 'Pinecone configuration not found'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            # Initialize Pinecone with new API
            pc = Pinecone(api_key=pinecone_api_key)
            index = pc.Index(pinecone_index_name)
            
            # Load the model
            model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Generate query embedding
            query_embedding = model.encode(query)
            
            # Search in Pinecone
            results = index.query(
                vector=query_embedding.tolist(),
                top_k=top_k,
                include_metadata=True
            )
            
            # Get product IDs from results
            product_ids = [int(result['id']) for result in results['matches']]
            
            # Fetch products from database
            products = Product.objects.filter(id__in=product_ids)
            
            # Serialize results
            serializer = self.get_serializer(products, many=True)
            
            # Add similarity scores to results
            search_results = []
            for product in products:
                for match in results['matches']:
                    if int(match['id']) == product.id:
                        product_data = serializer.data[0] if len(serializer.data) == 1 else next(
                            (p for p in serializer.data if p['id'] == product.id), None
                        )
                        if product_data:
                            product_data['similarity_score'] = match['score']
                            search_results.append(product_data)
                        break
            
            return Response({
                'query': query,
                'results': search_results,
                'total_found': len(search_results)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Search failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([AllowAny])
def chat_endpoint(request):
    """
    Conversational chat endpoint for product recommendations
    Usage: POST /api/chat/ with JSON body: {"question": "your question"}
    """
    try:
        data = request.data
        question = data.get('question', '').strip()
        
        if not question:
            return Response(
                {'error': 'Question is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Load environment variables
        load_dotenv()
        
        # Initialize Pinecone
        pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        index = pc.Index(os.getenv('PINECONE_INDEX_NAME'))
        
        # Initialize the sentence transformer model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Generate embedding for the question
        question_embedding = model.encode(question)
        
        # Query Pinecone for similar products
        results = index.query(
            vector=question_embedding.tolist(),
            top_k=3,
            include_metadata=True
        )
        
        product_ids = [int(result['id']) for result in results['matches']]
        products = Product.objects.filter(id__in=product_ids)
        
        if not products.exists():
            return Response({
                'message': f"I couldn't find any products matching your query about '{question}'. Please try different keywords or browse our catalog.",
                'products': [],
                'total_found': 0,
                'query': question
            })
        
        serializer = ProductSerializer(products, many=True)
        product_data = serializer.data
        
        # Add similarity scores to products
        product_score_pairs = []
        for product in product_data:
            for match in results['matches']:
                if int(match['id']) == product['id']:
                    product['similarity_score'] = match['score']
                    product_score_pairs.append((product, match['score']))
                    break
        
        # Sort by similarity score in descending order
        product_score_pairs.sort(key=lambda x: x[1], reverse=True)
        sorted_product_data = [product for product, score in product_score_pairs]
        
        message = f"I found {len(sorted_product_data)} product{'s' if len(sorted_product_data) != 1 else ''} matching your query about '{question}'. Here are the best matches:"
        
        return Response({
            'message': message,
            'products': sorted_product_data,
            'total_found': len(sorted_product_data),
            'query': question
        })
        
    except Exception as e:
        return Response(
            {'error': f'Chat service error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def product_detail(request, product_id):
    from .models import Product
    product = get_object_or_404(Product, id=product_id)
    return render(request, 'product_detail.html', {'product': product})
