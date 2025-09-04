import type { Handler, HandlerEvent } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI_NEW;

// Helper function to get relevant documents
async function getRelevantDocuments(answers: string[]) {
  if (!MONGODB_URI) return '';
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const collection = db.collection('referenceDocuments');
    
    // Search for documents related to the answers (simple approach without text index)
    const searchQuery = answers.join(' ').toLowerCase();
    const documents = await collection.find({}).limit(3).toArray();
    
    // Simple client-side filtering
    const relevantDocuments = documents.filter(doc => 
      doc.title.toLowerCase().includes(searchQuery) ||
      doc.content.toLowerCase().includes(searchQuery) ||
      doc.category.toLowerCase().includes(searchQuery)
    ).slice(0, 3);
    
    await client.close();
    
    if (relevantDocuments.length === 0) return '';

    const documentContext = relevantDocuments.map(doc => 
      `Document: ${doc.title}\nCategory: ${doc.category}\nContent: ${doc.content.substring(0, 500)}...`
    ).join('\n\n');

    return `\n\nReference Documents:\n${documentContext}`;
  } catch (error) {
    console.error('Error fetching reference documents:', error);
    return '';
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  if (!CLAUDE_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing CLAUDE_API_KEY' }),
    };
  }

  try {
    const { answers, context } = JSON.parse(event.body || '{}');
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid answers' }),
      };
    }

    // Get relevant reference documents
    const documentContext = await getRelevantDocuments(answers);
    
    // Compose the prompt with RAG context
    const prompt = `You are an affirming, culturally responsive assistant. Based on the following parent answers, generate a brief, positive summary for a teacher. Use the parent's words as much as possible. ${context ? `Context: ${context}` : ''}${documentContext}\n\nAnswers:\n${answers.map((a: string) => '- ' + a).join('\n')}`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });
    const data = await response.json();
    const summary = data.content?.[0]?.text || '';
    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
}; 