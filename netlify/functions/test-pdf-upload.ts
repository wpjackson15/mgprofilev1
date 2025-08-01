import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('=== PDF Upload Test ===');
    console.log('Content-Type:', event.headers['content-type']);
    console.log('Body length:', event.body?.length || 0);
    console.log('Body preview:', event.body?.substring(0, 500));
    
    const contentType = event.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Not multipart form data',
          contentType 
        }),
      };
    }

    // Extract boundary
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'No boundary found',
          contentType 
        }),
      };
    }

    const boundary = boundaryMatch[1];
    const body = event.body || '';
    
    // Split by boundary
    const parts = body.split(`--${boundary}`);
    console.log('Found', parts.length, 'parts');
    
    let pdfFound = false;
    let pdfSize = 0;
    
    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data; name="pdf"')) {
        pdfFound = true;
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          pdfSize = part.length - headerEnd - 4;
        }
        break;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true,
        pdfFound,
        pdfSize,
        partsCount: parts.length,
        boundary,
        bodyLength: body.length
      }),
    };
    
  } catch (error) {
    console.error('Test error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 