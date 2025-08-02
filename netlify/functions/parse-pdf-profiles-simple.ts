import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('=== PDF Parsing Request (Simple) ===');
    console.log('Content-Type:', event.headers['content-type']);
    console.log('Body length:', event.body?.length || 0);
    
    // Parse multipart form data using a simpler approach
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Expected multipart/form-data' }),
      };
    }

    const body = event.body || '';
    console.log('Body preview:', body.substring(0, 500));
    
    // Very simple approach: look for PDF data between boundaries
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      console.error('No boundary found in content type');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No boundary found in content type' }),
      };
    }

    const boundary = boundaryMatch[1];
    console.log('Boundary:', boundary);
    
    // Split by boundary and find the part with actual data
    const boundaryStart = `--${boundary}`;
    const parts = body.split(boundaryStart);
    console.log('Found', parts.length, 'parts in multipart data');
    
    // Find the part that contains the actual file data (not headers)
    let pdfData = null;
    let pdfFileName = 'unknown.pdf';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      console.log(`Part ${i} length:`, part.length);
      console.log(`Part ${i} preview:`, part.substring(0, 200));
      
      // Skip empty parts
      if (part.trim().length === 0) continue;
      
      // Look for parts that contain file data (not just headers)
      if (part.includes('Content-Disposition: form-data') && part.includes('name="pdf"') && part.length > 1000) {
        console.log(`Found PDF file part at index ${i}, length: ${part.length}`);
        
        // Extract filename if present
        const filenameMatch = part.match(/filename="([^"]*)"/);
        if (filenameMatch) {
          pdfFileName = filenameMatch[1];
          console.log('File filename:', pdfFileName);
        }
        
        // Find the end of headers (look for double newline)
        let headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          headerEnd = part.indexOf('\n\n');
        }
        
        if (headerEnd !== -1) {
          // Extract file data (everything after headers)
          pdfData = part.substring(headerEnd + (part.includes('\r\n\r\n') ? 4 : 2));
          
          // Remove trailing boundary if present
          const boundaryEnd = `--${boundary}--`;
          if (pdfData.endsWith(boundaryEnd)) {
            pdfData = pdfData.substring(0, pdfData.length - boundaryEnd.length - 2);
          }
          
          console.log('File data extracted, length:', pdfData.length);
          console.log('File data starts with:', pdfData.substring(0, 100));
          break;
        }
      }
    }
    
    if (!pdfData) {
      console.error('No file data found in multipart form');
      console.log('All parts:', parts.map((p, i) => `Part ${i}: ${p.substring(0, 100)}...`));
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No PDF file provided' }),
      };
    }

    // Create a prompt for the LLM to parse student profiles from PDF
    const prompt = `Please analyze this PDF document and extract student profiles. Look for information about students including their names, grade levels, subjects, and learning profiles or characteristics.

Please extract all student profiles you can find and return them as a JSON array with the following structure:
[
  {
    "name": "Student Name",
    "grade": "Grade Level (e.g., 3rd Grade, Grade 3, 3)",
    "subject": "Subject (e.g., Math, Science, ELA)",
    "profile": "Description of the student's learning style, strengths, challenges, cultural background, interests, etc."
  }
]

If you can't find structured student information, try to identify any individuals mentioned and create profiles based on the context. If no clear student information is found, return an empty array.

Return only the JSON array, no additional text.`;

    console.log('Calling Claude API...');
    
    // Convert PDF data to base64 for Claude API
    const pdfBase64 = Buffer.from(pdfData, 'binary').toString('base64');
    console.log('PDF base64 length:', pdfBase64.length);
    
    // Call Claude API with the PDF directly
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'file',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response received');
    const content = data.content[0]?.text || '';
    console.log('Claude response content length:', content.length);

    // Try to extract JSON from the response
    let profiles = [];
    try {
      console.log('Attempting to parse JSON from response...');
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        profiles = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed profiles:', profiles.length);
      } else {
        console.log('No JSON array found in response');
        console.log('Response content:', content.substring(0, 500));
        
        // Fallback: create a basic profile
        profiles = [{
          name: 'Student from PDF',
          grade: 'Unknown Grade',
          subject: 'Unknown Subject',
          profile: 'Profile extracted from uploaded PDF document'
        }];
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      console.log('Raw response content:', content);
      
      // Fallback: create a basic profile
      profiles = [{
        name: 'Student from PDF',
        grade: 'Unknown Grade',
        subject: 'Unknown Subject',
        profile: 'Profile extracted from uploaded PDF document'
      }];
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ profiles }),
    };
  } catch (error) {
    console.error('Error parsing PDF profiles:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Failed to parse PDF profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 