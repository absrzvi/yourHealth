/**
 * Ollama API Connector
 * 
 * This module provides a connector to the Ollama API for local LLM inference.
 * It follows the Simplicity First (SF) principle by providing a straightforward
 * API wrapper around the Ollama REST API.
 */

export interface OllamaRequestOptions {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number; // max tokens equivalent
    stop?: string[];
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaStreamChunk extends OllamaResponse {
  // Stream chunks extend the basic response
}

/**
 * Check if Ollama is available and running
 */
export async function checkOllamaAvailability(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Ollama availability check failed:', error);
    return false;
  }
}

/**
 * Get list of available models from Ollama
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.error('Failed to list Ollama models:', error);
    return [];
  }
}

/**
 * Generate a completion from Ollama
 */
export async function generateOllamaCompletion(options: OllamaRequestOptions): Promise<OllamaResponse> {
  try {
    console.log(`Requesting Ollama completion for model: ${options.model}`);
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        stream: false,
        options: options.options || {},
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Ollama completion error:', error);
    throw error;
  }
}

/**
 * Stream a completion from Ollama
 */
export async function* streamOllamaCompletion(
  options: OllamaRequestOptions,
): AsyncGenerator<OllamaStreamChunk> {
  try {
    console.log(`Streaming Ollama completion for model: ${options.model}`);
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        stream: true,
        options: options.options || {},
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }
    
    if (!response.body) {
      throw new Error('Ollama API returned no response body');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line);
            yield chunk;
            
            if (chunk.done) {
              return;
            }
          } catch (e) {
            console.warn('Error parsing Ollama stream chunk:', e);
          }
        }
      }
    }
    
    // Process any remaining buffer content
    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer);
      } catch (e) {
        console.warn('Error parsing final Ollama stream chunk:', e);
      }
    }
  } catch (error) {
    console.error('Ollama streaming error:', error);
    throw error;
  }
}
