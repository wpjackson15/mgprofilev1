import type { Handler, HandlerEvent } from '@netlify/functions';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

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

    // Compose the prompt
    const prompt = `You are an affirming, culturally responsive assistant. Based on the following parent answers, generate a brief, positive summary for a teacher. Use the parent's words as much as possible. ${context ? `Context: ${context}` : ''}\n\nAnswers:\n${answers.map((a: string) => '- ' + a).join('\n')}`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });
    const data = await response.json();
    // Claude returns content as an array of message parts
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