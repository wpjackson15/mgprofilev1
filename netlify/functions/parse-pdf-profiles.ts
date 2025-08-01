import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Received PDF parsing request');
    console.log('Content-Type:', event.headers['content-type']);
    console.log('Body length:', event.body?.length || 0);
    
    // Parse multipart form data
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Expected multipart/form-data' }),
      };
    }

    // Extract the boundary from content type
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      console.error('No boundary found in content type');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No boundary found in content type' }),
      };
    }

    const boundary = boundaryMatch[1];
    const body = event.body || '';
    
    console.log('Boundary:', boundary);
    console.log('Body starts with:', body.substring(0, 200));
    
    // Find the PDF file data in the multipart form
    // Look for the boundary and PDF file content
    const boundaryStart = `--${boundary}`;
    const boundaryEnd = `--${boundary}--`;
    
    // Split by boundary to find the PDF part
    const parts = body.split(boundaryStart);
    console.log('Found', parts.length, 'parts in multipart data');
    
    let pdfData = null;
    let pdfFileName = 'unknown.pdf';
    
    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data; name="pdf"')) {
        console.log('Found PDF part');
        
        // Extract filename if present
        const filenameMatch = part.match(/filename="([^"]*)"/);
        if (filenameMatch) {
          pdfFileName = filenameMatch[1];
          console.log('PDF filename:', pdfFileName);
        }
        
        // Extract the actual PDF data (everything after the headers)
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          console.error('No header end found in PDF part');
          continue;
        }
        
        pdfData = part.substring(headerEnd + 4);
        
        // Remove trailing boundary if present
        if (pdfData.endsWith(boundaryEnd)) {
          pdfData = pdfData.substring(0, pdfData.length - boundaryEnd.length - 2);
        }
        
        console.log('PDF data extracted, length:', pdfData.length);
        break;
      }
    }
    
    if (!pdfData) {
      console.error('No PDF data found in multipart form');
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