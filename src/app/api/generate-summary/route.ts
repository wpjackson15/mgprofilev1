import { NextRequest, NextResponse } from 'next/server';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export async function POST(request: NextRequest) {
  if (!CLAUDE_API_KEY) {
    return NextResponse.json(
      { error: 'Missing CLAUDE_API_KEY' },
      { status: 500 }
    );
  }

  try {
    const { answers, context } = await request.json();
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid answers' },
        { status: 400 }
      );
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
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: `Claude API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text || '';
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
