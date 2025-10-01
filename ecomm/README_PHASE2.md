# E-Commerce App - Phase 2: Semantic Search with Pinecone

This phase adds semantic search capabilities to the e-commerce application using Hugging Face sentence-transformers and Pinecone Serverless.

## Features Added

- **Semantic Product Indexing**: All products are indexed with 384-dimensional embeddings
- **Semantic Search API**: Search products using natural language queries
- **Pinecone Integration**: Vector database for fast similarity search
- **Management Commands**: Easy-to-use commands for indexing and data loading

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note**: If you encounter any issues with the Pinecone package, you can also install it directly:
```bash
pip install pinecone
```

### 2. Environment Variables

Set the following environment variables for Pinecone:

```bash
export PINECONE_API_KEY="your_pinecone_api_key"
export PINECONE_HOST="your_pinecone_host"
export PINECONE_INDEX_NAME="your_index_name"
```

**Important**: Your Pinecone index must be configured with:
- **Dimensions**: 384 (for all-MiniLM-L6-v2 model)
- **Metric**: cosine (recommended)

### 3. Database Setup

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Load Demo Products

```bash
python manage.py load_demo_products
```

### 5. Index Products for Semantic Search

```bash
python manage.py index_products
```

## API Endpoints

### Product Listing
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Get specific product

### Semantic Search
- `GET /api/products/search/?query=your_search_query&top_k=5`

**Parameters:**
- `query` (required): Your search query
- `top_k` (optional): Number of results to return (default: 5)

**Example:**
```bash
curl "http://localhost:8000/api/products/search/?query=comfortable%20cotton%20clothing&top_k=3"
```

## Management Commands

### Load Demo Products
```bash
python manage.py load_demo_products
```
Loads 22 demo products from `catalog/demoproducts.json`

### Index Products
```bash
python manage.py index_products
```
Generates embeddings for all products and uploads them to Pinecone

## Technical Details

### Embedding Model
- **Model**: `all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Text**: Concatenated product title + description

### Vector Database
- **Platform**: Pinecone Serverless
- **Index Type**: Vector similarity search
- **Metadata**: title, description, category, brand

### Search Process
1. User submits natural language query
2. Query is converted to 384-dimensional embedding
3. Pinecone performs similarity search
4. Results are ranked by similarity score
5. Full product data is returned with scores

## Error Handling

The application includes comprehensive error handling for:
- Missing environment variables
- Pinecone connection issues
- Model loading failures
- Vector upsert errors
- Search query validation

## Performance Notes

- **Indexing**: ~1-2 seconds per product (first run)
- **Search**: ~100-200ms per query
- **Model Loading**: ~2-3 seconds (cached after first load)

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all Pinecone environment variables are set

2. **"Pinecone configuration not found"**
   - Check your API key, host, and index name

3. **"No products found in the database"**
   - Run `python manage.py load_demo_products` first

4. **"Search failed"**
   - Verify Pinecone index exists and has correct dimensions (384)

5. **Pinecone import errors**
   - Make sure you have the correct package: `pip install pinecone` (not `pinecone-client`)

### Pinecone Index Setup

If you need to create a new Pinecone index:

```python
import pinecone

pinecone.init(api_key="your_api_key")
pinecone.create_index(
    name="your_index_name",
    dimension=384,
    metric="cosine"
)
```

## Security Notes

- All credentials are loaded from environment variables
- No hardcoded API keys in the codebase
- Search queries are validated and sanitized
- Error messages don't expose sensitive information 