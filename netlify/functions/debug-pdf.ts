import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  console.log('=== DEBUG PDF UPLOAD ===');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Body length:', event.body?.length || 0);
  console.log('Body preview:', event.body?.substring(0, 1000));
  
  if (event.httpMethod === 'POST') {
    const contentType = event.headers['content-type'] || '';
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        console.log('Boundary:', boundary);
        
        const body = event.body || '';
        const parts = body.split(`--${boundary}`);
        console.log('Parts count:', parts.length);
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          console.log(`Part ${i}:`);
          console.log(`  Length: ${part.length}`);
          console.log(`  Contains "pdf": ${part.includes('pdf')}`);
          console.log(`  Contains "Content-Disposition": ${part.includes('Content-Disposition')}`);
          console.log(`  Preview: ${part.substring(0, 200)}`);
        }
      }
    }
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ 
      message: 'Debug endpoint called',
      method: event.httpMethod,
      contentType: event.headers['content-type'],
      bodyLength: event.body?.length || 0
    }),
  };
}; 