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
    const body = JSON.parse(event.body || '{}');
    const { pdfBase64 } = body;

    if (!pdfBase64) {
      console.error('No PDF base64 data provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No PDF provided' }),
      };
    }

    console.log('PDF base64 length:', pdfBase64.length);

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
      },
      body: JSON.stringify({ profiles }),
    };
  } catch (error) {
    console.error('Error parsing PDF profiles:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to parse PDF profiles' }),
    };
  }
}; 