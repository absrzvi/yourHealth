import { openai, DEFAULT_MODEL, SYSTEM_PROMPT } from './openai';
import { OpenAI } from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export async function* streamChatCompletion(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  temperature: number = 0.7,
  maxTokens: number = 1024
): AsyncIterable<string> {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error in streamChatCompletion:', error);
    throw new Error('Failed to generate chat completion');
  }
}

export async function getChatCompletion(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  temperature: number = 0.7,
  maxTokens: number = 1024
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in getChatCompletion:', error);
    throw new Error('Failed to get chat completion');
  }
}

export function formatChatMessage(role: 'user' | 'assistant', content: string, name?: string): ChatMessage {
  return { role, content, name };
}

export function formatUserMessage(content: string, name?: string): ChatMessage {
  return formatChatMessage('user', content, name);
}

export function formatAssistantMessage(content: string): ChatMessage {
  return formatChatMessage('assistant', content);
}
