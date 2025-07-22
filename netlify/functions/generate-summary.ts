import type { Handler, HandlerEvent } from '@netlify/functions';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }),
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

    // Compose the prompt
    const prompt = [
      {
        role: 'user',
        parts: [
          `You are an affirming, culturally responsive assistant. Based on the following parent answers, generate a brief, positive summary for a teacher. Use the parent's words as much as possible. ${context ? `Context: ${context}` : ''}\n\nAnswers:\n${answers.map((a: string) => '- ' + a).join('\n')}`
        ]
      }
    ];

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents: prompt }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error }),
      };
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0] || '';

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