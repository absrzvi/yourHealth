/**
 * Base LLM Interface
 * 
 * Defines the interface that all LLM implementations must follow.
 * Following the interface segregation principle for clean architecture. [CA]
 */

import { MedicalDomain } from '../../shared/types/ai-coach-types';

/**
 * LLMOptions - Configuration options for LLM inference
 */
export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  timeout?: number;
  streaming?: boolean;
}

/**
 * Medical prompt details for contextualizing queries
 */
export interface MedicalPrompt {
  query: string;
  medicalContext?: string;
  medicalDomain?: MedicalDomain;
  safetyInstructions?: string;
  referenceContext?: string[];
  includeDisclaimer?: boolean;
}

/**
 * LLM response format with detailed metadata
 */
export interface LLMResponse {
  text: string;
  modelName: string;
  tokensUsed?: number;
  latencyMs?: number;
  confidence?: number;
  complete: boolean;
  error?: string;
  provider?: 'ollama' | 'openai' | 'cpu' | 'cloud' | 'mock' | 'error';
}

/**
 * StreamChunk - Format for streaming response chunks
 */
export interface StreamChunk {
  text: string;
  isComplete: boolean;
  error?: string;
  provider?: 'ollama' | 'openai' | 'cpu' | 'cloud' | 'mock' | 'error';
}

/**
 * Abstract base class for all LLM implementations
 * Using abstract class pattern to enforce common behavior [CA]
 */
export abstract class BaseLLM {
  /**
   * Model name identifier
   */
  protected modelName: string;
  
  /**
   * Default options for this LLM
   */
  protected defaultOptions: LLMOptions;

  constructor(modelName: string, defaultOptions: LLMOptions) {
    this.modelName = modelName;
    this.defaultOptions = {
      temperature: 0.7,
      maxTokens: 1024,
      ...defaultOptions
    };
  }

  /**
   * Complete a prompt with the LLM
   */
  abstract complete(prompt: string | MedicalPrompt, options?: LLMOptions): Promise<LLMResponse>;

  /**
   * Stream a response for a given prompt
   */
  abstract stream(
    prompt: string | MedicalPrompt, 
    options?: LLMOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk>;

  /**
   * Format a medical prompt with appropriate context and instructions
   */
  protected formatMedicalPrompt(prompt: string | MedicalPrompt): string {
    // Simple implementation, should be overridden in specific LLM classes
    if (typeof prompt === 'string') {
      return prompt;
    }
    
    // Build formatted prompt with medical context
    let formattedPrompt = `Question: ${prompt.query}\n\n`;
    
    if (prompt.medicalContext) {
      formattedPrompt = `Medical Context: ${prompt.medicalContext}\n\n${formattedPrompt}`;
    }
    
    if (prompt.referenceContext && prompt.referenceContext.length > 0) {
      formattedPrompt += `\nReference Information:\n${prompt.referenceContext.join('\n')}\n\n`;
    }
    
    if (prompt.safetyInstructions) {
      formattedPrompt += `\nImportant Safety Instructions: ${prompt.safetyInstructions}\n\n`;
    }
    
    // Add medical disclaimer if requested
    if (prompt.includeDisclaimer) {
      formattedPrompt += `\nPlease provide a helpful, accurate answer to the medical question. Include a disclaimer that this is not medical advice and the user should consult a healthcare professional.\n`;
    }
    
    return formattedPrompt;
  }

  /**
   * Estimate the number of tokens in a text string
   * Rough estimation - 1 token ≈ 4 characters for English text
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Factory function to create an LLM based on config
 */
export interface LLMFactory {
  createLLM(config: LLMOptions | Record<string, unknown>): BaseLLM;
}
