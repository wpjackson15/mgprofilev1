import type { Handler, HandlerEvent } from '@netlify/functions';
import { ClaudeSummaryRequest, ClaudeSummaryResponse } from '../../src/lib/schemas';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY_LESSON_PLANS;

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
      body: JSON.stringify({ error: 'Missing CLAUDE_API_KEY_LESSON_PLANS' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate request
    const validatedRequest = ClaudeSummaryRequest.parse(body);
    
    // Build context from retrieval results
    const contextText = validatedRequest.retrievalContext
      .map(ctx => `Source: ${ctx.source}\nTitle: ${ctx.title}\nContent: ${ctx.chunk}`)
      .join('\n\n');
    
    // Build normalized data text
    const normalizedText = Object.entries(validatedRequest.normalized)
      .map(([element, answers]) => `${element}:\n${answers.map(a => `- ${a}`).join('\n')}`)
      .join('\n\n');
    
    // Compose the prompt with strict schema requirements
    const prompt = `You are an expert in analyzing student profiles for their "genius elements" - the unique strengths and cultural assets that make each child special.

Based on the following student responses and knowledge base context, generate a comprehensive summary that follows this EXACT structure:

Student Responses:
${normalizedText}

Knowledge Base Context:
${contextText}

Generate a JSON response with this EXACT structure (no additional text, just valid JSON):

{
  "geniusElements": {
    "interestAwareness": "20+ word analysis of the student's awareness of their interests and passions",
    "racialPride": "20+ word analysis of the student's racial/cultural pride and identity",
    "canDoAttitude": "20+ word analysis of the student's confidence and can-do attitude",
    "multiculturalNavigation": "20+ word analysis of the student's ability to navigate diverse cultural contexts",
    "selectiveTrust": "20+ word analysis of the student's selective trust and discernment",
    "socialJustice": "20+ word analysis of the student's awareness of social justice issues"
  },
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "growthEdges": ["growth area 1", "growth area 2", "growth area 3"],
  "relationshipMovesForAdults": ["specific action 1", "specific action 2", "specific action 3"],
  "cautions": ["caution 1", "caution 2"],
  "flags": {
    "missingData": ["any missing information"],
    "offTopic": false,
    "safetyConcerns": false
  }
}

Focus on the student's unique genius and cultural assets. Be specific and actionable.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Claude API error: ${response.status}` }),
      };
    }

    const data = await response.json();
    const summaryText = data.content?.[0]?.text || '';
    
    // Try to parse the JSON response
    let summary;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      summary = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to parse Claude response as JSON' }),
      };
    }
    
    // Validate the parsed response
    const validatedSummary = ClaudeSummaryResponse.parse(summary);
    
    // Calculate tokens (approximate)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(summaryText.length / 4);
    const costUSD = (inputTokens * 0.003 + outputTokens * 0.015) / 1000; // Approximate Claude pricing
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: validatedSummary,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          costUSD
        },
        model: 'claude-3-5-sonnet-20241022'
      }),
    };
  } catch (error) {
    console.error('Error in generate-enhanced-summary:', error);
    
    if (error instanceof Error && error.message.includes('ZodError')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: error.message 
        }),
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
