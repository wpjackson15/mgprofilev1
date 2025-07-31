import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { pdfBase64 } = JSON.parse(event.body || '{}');

    if (!pdfBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No PDF provided' }),
      };
    }

    // Create a prompt for the LLM to parse student profiles directly from PDF
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
                type: 'image',
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

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    // Try to extract JSON from the response
    let profiles = [];
    try {
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        profiles = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      // Fallback: return empty array
      profiles = [];
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