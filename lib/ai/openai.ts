import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default to gpt-3.5-turbo if OPENAI_MODEL is not set
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

export const SYSTEM_PROMPT = `You are a knowledgeable and empathetic health coach. Your role is to help users understand their health data and make informed decisions. 

Guidelines:
- Be supportive and non-judgmental
- Focus on evidence-based information
- Keep responses concise and actionable
- Ask clarifying questions when needed
- Reference the user's specific health data when available
- Never provide medical diagnosis or treatment advice`;
