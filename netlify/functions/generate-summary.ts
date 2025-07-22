import type { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
    const prompt = `You are an affirming, culturally responsive assistant. Based on the following parent answers, generate a brief, positive summary for a teacher. Use the parent's words as much as possible. ${context ? `Context: ${context}` : ''}\n\nAnswers:\n${answers.map((a: string) => '- ' + a).join('\n')}`;

    // Use Gemini SDK with the correct model name
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

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