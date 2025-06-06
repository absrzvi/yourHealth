/**
 * OpenAI Fallback LLM Implementation
 * 
 * Provides a fallback to OpenAI's GPT models when local CPU models 
 * are insufficient for complex medical queries.
 * 
 * Implements HIPAA-compliant error handling and logging [SFT].
 */

import { BaseLLM, LLMOptions, LLMResponse, MedicalPrompt, StreamChunk } from './base-llm';
import { MEDICAL_DISCLAIMERS } from '../../shared/constants/medical-constants';

/**
 * OpenAI API configuration interface
 */
interface OpenAIConfig {
  apiKey: string;
  model: string;
  organization?: string;
  baseURL?: string;
}

/**
 * Mock OpenAI API client - will be replaced with actual OpenAI SDK
 * Following dependency minimalism principle [DM]
 */
class MockOpenAIClient {
  private config: OpenAIConfig;
  
  constructor(config: OpenAIConfig) {
    this.config = config;
  }
  
  async createCompletion(params: Record<string, unknown>) {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      choices: [{ text: this.mockOpenAIResponse(typeof params.prompt === 'string' ? params.prompt : '') }],
      usage: {
        total_tokens: Math.ceil((typeof params.prompt === 'string' ? params.prompt.length : 0) / 4) + 150
      }
    };
  }
  
  async createChatCompletion(params: Record<string, unknown>) {
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      choices: [{ 
        message: { content: this.mockOpenAIResponse(Array.isArray(params.messages) && params.messages.length > 0 ? params.messages[params.messages.length - 1].content : '') },
        finish_reason: 'stop'
      }],
      usage: {
        total_tokens: Array.isArray(params.messages) ? params.messages.reduce((acc: number, msg: any) => acc + Math.ceil((msg.content?.length ?? 0) / 4), 0) + 200 : 200
      }
    };
  }
  
  private mockOpenAIResponse(prompt: string): string {
    // Generate appropriate mock response based on prompt content
    if (prompt.toLowerCase().includes('emergency')) {
      return "I notice this might be about an urgent medical situation. If you're experiencing a medical emergency, please call emergency services immediately (like 911 in the US). This is not medical advice and should not delay you seeking professional medical help.";
    } else if (prompt.toLowerCase().includes('blood test') || prompt.toLowerCase().includes('lab result')) {
      return "Based on general medical knowledge, I can provide some information about typical blood test results. However, I want to emphasize that interpreting lab results requires medical expertise and should be done by a healthcare professional who knows your complete medical history. The information I'm providing is educational only and not a substitute for professional medical advice.";
    } else if (prompt.toLowerCase().includes('medication') || prompt.toLowerCase().includes('drug')) {
      return "I can provide general information about this medication based on medical literature. However, medication guidance should always be personalized by a healthcare provider based on your specific health needs. Never change your medication regimen without consulting your doctor. This information is educational only.";
    } else {
      return "Based on medical literature, I can provide some general information on this topic. However, everyone's health situation is unique, and what applies generally may not apply to your specific situation. This information is for educational purposes only and not intended to replace professional medical advice, diagnosis, or treatment.";
    }
  }
}

/**
 * OpenAIFallbackLLM - Cloud-based fallback for complex medical queries
 */
export class OpenAIFallbackLLM extends BaseLLM {
  private client: MockOpenAIClient;
  private config: OpenAIConfig;
  
  /**
   * Initialize the OpenAI fallback LLM service
   */
  constructor(config?: Partial<OpenAIConfig>) {
    // Default to GPT-4 which has better medical reasoning capabilities
    const defaultConfig: OpenAIConfig = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4',
      ...config
    };
    
    super(defaultConfig.model, {
      temperature: 0.5, // Lower temperature for medical responses
      maxTokens: 2048,
    });
    
    this.config = defaultConfig;
    
    // Validate API key for security
    this.validateAPIKey();
    
    // Initialize OpenAI client
    this.client = new MockOpenAIClient(this.config);
  }
  
  /**
   * Complete a prompt with OpenAI models
   * Includes HIPAA-compliant error handling [SFT]
   */
  async complete(prompt: string | MedicalPrompt, options?: LLMOptions): Promise<LLMResponse> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    try {
      // Format the prompt with medical considerations
      const formattedPrompt = this.formatMedicalPrompt(prompt);
      
      // Create messages for chat completion
      const messages = this.createChatMessages(formattedPrompt);
      
      // In real implementation, call actual OpenAI API
      // For now, use our mock client
      const response = await this.client.createChatCompletion({
        model: this.config.model,
        messages,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.maxTokens,
      });
      
      const responseText = response.choices[0].message.content;
      const latencyMs = Date.now() - startTime;
      
      // Add audit log for HIPAA compliance [SFT]
      this.logAPIUsage('completion', this.modelName, latencyMs);
      
      return {
        text: responseText,
        modelName: this.modelName,
        tokensUsed: response.usage.total_tokens,
        latencyMs,
        confidence: 0.95, // GPT models generally have high confidence
        complete: response.choices[0].finish_reason === 'stop'
      };
    } catch (error) {
      // Secure error handling for HIPAA compliance [SFT]
      console.error('OpenAI API error:', this.sanitizeError(error));
      
      // Don't expose internal error details in response
      return {
        text: '',
        modelName: this.modelName,
        complete: false,
        error: 'Unable to generate response. Please try again later.'
      };
    }
  }
  
  /**
   * Stream a response from OpenAI models
   */
  async *stream(
    prompt: string | MedicalPrompt,
    options?: LLMOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    const mergedOptions = { ...this.defaultOptions, ...options, streaming: true };
    const startTime = Date.now();
    
    try {
      // Format the prompt with medical considerations
      const formattedPrompt = this.formatMedicalPrompt(prompt);
      
      // Create messages for chat completion
      const messages = this.createChatMessages(formattedPrompt);
      
      // For demonstration, we'll simulate streaming with chunks
      // In a real implementation, we would use OpenAI's streaming API
      
      // Get full response first (using our mock client)
      const response = await this.client.createChatCompletion({
        model: this.config.model,
        messages,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.maxTokens,
      });
      
      const fullText = response.choices[0].message.content;
      
      // Simulate streaming by breaking text into chunks
      const chunks = this.simulateStreamingChunks(fullText);
      
      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;
        const chunk: StreamChunk = {
          text: chunks[i],
          isComplete: isLast
        };
        
        if (onChunk) {
          onChunk(chunk);
        }
        
        yield chunk;
        
        // Simulate streaming delay
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      // Log API usage for HIPAA compliance [SFT]
      const latencyMs = Date.now() - startTime;
      this.logAPIUsage('stream', this.modelName, latencyMs);
      
    } catch (error) {
      const errorChunk: StreamChunk = {
        text: '',
        isComplete: true,
        error: 'Unable to generate streaming response. Please try again later.'
      };
      
      console.error('OpenAI streaming error:', this.sanitizeError(error));
      
      if (onChunk) {
        onChunk(errorChunk);
      }
      
      yield errorChunk;
    }
  }
  
  /**
   * Format a medical prompt for OpenAI with enhanced system instructions
   * 
   * This creates a specialized medical context for more accurate responses [RP]
   */
  protected formatMedicalPrompt(prompt: string | MedicalPrompt): string {
    // Enhanced formatting for OpenAI chat completions
    if (typeof prompt === 'string') {
      return prompt;
    }
    
    let systemInstructions = 'You are an AI medical assistant providing health information with careful attention to accuracy and safety. ';
    systemInstructions += 'Always maintain a professional, empathetic tone. ';
    
    if (prompt.medicalDomain) {
      systemInstructions += `You specialize in ${prompt.medicalDomain.toLowerCase()} knowledge. `;
    }
    
    systemInstructions += 'Never provide definitive diagnoses or treatment plans. ';
    systemInstructions += 'Always remind users to consult healthcare professionals for medical decisions. ';
    systemInstructions += 'If asked about emergency situations, always advise seeking immediate medical attention. ';
    
    if (prompt.safetyInstructions) {
      systemInstructions += `${prompt.safetyInstructions} `;
    }
    
    let userMessage = `${prompt.query}`;
    
    if (prompt.medicalContext) {
      userMessage = `Medical Context: ${prompt.medicalContext}\n\nQuestion: ${prompt.query}`;
    }
    
    if (prompt.referenceContext && prompt.referenceContext.length > 0) {
      userMessage += `\n\nRelevant medical information:\n${prompt.referenceContext.join('\n')}`;
    }
    
    // Return formatted system instructions and user message
    return `${systemInstructions}\n\n${userMessage}`;
  }
  
  /**
   * Create properly formatted chat messages for OpenAI API
   */
  private createChatMessages(formattedPrompt: string): Array<{ role: string, content: string }> {
    // Split the formatted prompt into system instructions and user message
    const parts = formattedPrompt.split('\n\n');
    const systemInstructions = parts[0];
    const userMessage = parts.slice(1).join('\n\n');
    
    return [
      { role: 'system', content: systemInstructions },
      { role: 'user', content: userMessage }
    ];
  }
  
  /**
   * Validate OpenAI API key for security [SFT]
   */
  private validateAPIKey(): void {
    if (!this.config.apiKey || this.config.apiKey === '') {
      console.warn('OpenAI API key not provided. Fallback LLM will not function properly.');
    } else if (this.config.apiKey === 'OPENAI_API_KEY') {
      // Check if it's an unresolved environment variable placeholder
      throw new Error('OpenAI API key appears to be an unresolved environment variable. Please check your .env file.');
    }
    
    // Additional validation could be added here
  }
  
  /**
   * Securely log API usage for HIPAA compliance [SFT]
   */
  private logAPIUsage(operation: string, model: string, latencyMs: number): void {
    // In a real implementation, this would log to a HIPAA-compliant audit log
    // For now, just console log without any PHI
    console.log(`OpenAI API ${operation} completed: model=${model}, latency=${latencyMs}ms`);
    
    // Note: This would be replaced with proper audit logging
    // auditLogger.log({
    //   eventType: 'api_call',
    //   service: 'openai',
    //   operation,
    //   model,
    //   latencyMs,
    //   timestamp: new Date().toISOString(),
    //   // No PHI should be logged here
    // });
  }
  
  /**
   * Sanitize error objects to prevent leaking sensitive data [SFT]
   */
  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      // Remove any potentially sensitive data from error message
      let message = error.message;
      
      // Redact API keys if they appear in error messages
      if (this.config.apiKey && message.includes(this.config.apiKey)) {
        message = message.replace(this.config.apiKey, '[REDACTED]');
      }
      
      return `${error.name}: ${message}`;
    }
    
    return String(error);
  }
  
  /**
   * Simulate streaming by breaking response into chunks
   * For development purposes only
   */
  private simulateStreamingChunks(fullText: string): string[] {
    // Split text into sentences as a simple approximation
    const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [];
    
    if (sentences.length <= 1) {
      // If no sentence breaks, split by spaces into multiple chunks
      const words = fullText.split(' ');
      const chunks = [];
      const chunkSize = 4; // words per chunk
      
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
      }
      
      return chunks;
    }
    
    return sentences;
  }
}
