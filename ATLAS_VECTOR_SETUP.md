# Atlas Vector Search Setup Guide

## Overview
This guide helps you set up MongoDB Atlas Vector Search for the knowledge base functionality.

## Prerequisites
- MongoDB Atlas cluster with M10 or higher tier (required for vector search)
- Access to Atlas Data Explorer

## Step 1: Create Vector Search Index

1. **Navigate to Atlas Data Explorer**
   - Go to your Atlas cluster
   - Click "Browse Collections"
   - Select your database (default: `bg`)

2. **Create the Index**
   - Click on the `kb_chunks` collection
   - Go to "Indexes" tab
   - Click "Create Index"

3. **Configure the Index**
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1536,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "metadata.tags"
       }
     ]
   }
   ```

4. **Index Settings**
   - **Index Name**: `vector_index`
   - **Index Type**: Search
   - **Analyzer**: Standard

## Step 2: Environment Variables

Add these to your `.env.local` and Netlify:

```bash
# MongoDB
MONGODB_URI=your_mongodb_connection_string
ATLAS_DB=bg

# Schema Version
SCHEMA_VERSION=1.0.0

# n8n Integration
N8N_SUMMARY_START_URL=https://your-n8n-instance.com/webhook/summary-start

# Claude API Keys
CLAUDE_API_KEY=your_summary_generation_key
CLAUDE_API_KEY_LESSON_PLANS=your_lesson_plan_key

# Embedding Model (optional)
EMBEDDING_MODEL=openai:text-embedding-3-small
```

## Step 3: Test Vector Search

You can test the vector search functionality using the MongoDB shell:

```javascript
// Connect to your database
use bg

// Test vector search query
db.kb_chunks.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.1, 0.2, 0.3, ...], // 1536-dimensional vector
      numCandidates: 100,
      limit: 8,
      filter: { "metadata.tags": { $in: ["BGFramework", "LessonPlanning"] } }
    }
  }
])
```

## Step 4: Knowledge Base Population

To populate your knowledge base with embeddings:

1. **Prepare your documents** in chunks
2. **Generate embeddings** using your preferred model
3. **Insert into `kb_chunks` collection** with proper metadata

Example document structure:
```json
{
  "_id": ObjectId("..."),
  "source": "BG_Interview_Guide",
  "uri": "https://example.com/doc1",
  "title": "Building Genius Framework",
  "chunk": "The Building Genius framework emphasizes...",
  "embedding": [0.1, 0.2, 0.3, ...],
  "metadata": {
    "tags": ["BGFramework", "LessonPlanning"],
    "schemaVersion": "1.0.0"
  },
  "createdAt": ISODate("2024-01-01T00:00:00Z")
}
```

## Step 5: Monitoring

Monitor your vector search performance:

- **Query latency**: Should be under 100ms for most queries
- **Hit rate**: Measure how often relevant chunks are returned
- **Index size**: Monitor storage usage

## Troubleshooting

### Common Issues

1. **Index not found**
   - Ensure you're using M10+ cluster
   - Check index name matches exactly: `vector_index`

2. **Dimension mismatch**
   - Ensure all embeddings are 1536-dimensional
   - Verify `numDimensions` in index matches your embeddings

3. **Performance issues**
   - Consider reducing `numCandidates` for faster queries
   - Use filters to narrow search scope

### Support

- [Atlas Vector Search Documentation](https://docs.atlas.mongodb.com/atlas-vector-search/)
- [Vector Search Best Practices](https://docs.atlas.mongodb.com/atlas-vector-search/best-practices/)
