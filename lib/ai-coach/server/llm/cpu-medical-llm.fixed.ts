/**
 * CPUMedicalLLM - Local LLM implementation using Ollama for fast CPU-based medical inference
 * 
 * This module implements a local LLM interface using Ollama for fast on-device inference.
 * It handles domain-specific medical prompting and response formatting.
 * @module CPUMedicalLLM
 */

import { BaseLLM, LLMOptions, LLMResponse, StreamChunk, MedicalPrompt as BaseMedicalPrompt } from './base-llm';
import { MedicalDomain } from '../../shared/types/ai-coach-types';
import { 
  checkOllamaAvailability, 
  generateOllamaCompletion, 
  listOllamaModels, 
  streamOllamaCompletion, 
  OllamaResponse, 
  OllamaStreamChunk,
  OllamaModel
} from './ollama-connector';

// Simple logger implementation
const logger = {
  info: (message: string) => console.log(`[CPUMedicalLLM] INFO: ${message}`),
  error: (message: string, error?: any) => console.error(`[CPUMedicalLLM] ERROR: ${message}`, error || ''),
  warn: (message: string) => console.warn(`[CPUMedicalLLM] WARN: ${message}`),
  debug: (message: string) => console.debug(`[CPUMedicalLLM] DEBUG: ${message}`),
};

/**
 * Default CPU model configuration for medical LLM
 */
const CPU_MODEL_CONFIG = {
  modelName: 'cpu-medical-llm',
  ollamaModelName: 'llama2:latest',
  contextWindow: 4096,
  embeddingDimensions: 768,
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: 'You are a knowledgeable assistant providing general health information. Always provide helpful but responsible health guidance.',
};

/**
 * Standard medical disclaimers to include in prompts
 */
const MEDICAL_DISCLAIMERS = {
  GENERAL: 'IMPORTANT: The information provided should not be considered medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.',
  EMERGENCY: 'In case of medical emergency, call emergency services immediately.',
  MEDICATION: 'Do not start, stop, or change any medication regimen without consulting your healthcare provider.',
  ACCURACY: 'While I strive to provide accurate information, medical knowledge evolves rapidly, and I may not have the most current information.'
};

/**
 * CPUMedicalLLM - Optimized for medical inference on CPU hardware
 * Now integrates with local Ollama API for optimized inference
 */
export class CPUMedicalLLM extends BaseLLM {
  private readonly ollamaModelName: string;
  private availabilityCache: boolean | null = null;
  private checkPromise: Promise<boolean> | null = null;
  private medicalDomainContext: Record<MedicalDomain, string>;
  
  /**
   * Initialize the Ollama-based medical LLM
   * @param modelName The display name for the model
   * @param options Additional options for the LLM
   */
  constructor(modelName: string = CPU_MODEL_CONFIG.modelName, options?: LLMOptions & { ollamaModelName?: string }) {
    // Initialize base class with model name and default options
    super(modelName, {
      temperature: CPU_MODEL_CONFIG.temperature,
      maxTokens: CPU_MODEL_CONFIG.maxTokens,
      ...options
    });
    
    // Set the Ollama model name (used for API calls)
    this.ollamaModelName = options?.ollamaModelName || CPU_MODEL_CONFIG.ollamaModelName;
    
    // Initialize domain-specific context for prompt enhancement
    this.medicalDomainContext = this.initializeDomainContext();
    
    // Check Ollama availability on initialization
    this.checkAvailability().catch(err => {
      logger.error('Failed to check Ollama availability during initialization', err);
    });
    
    logger.info(`CPUMedicalLLM initialized with Ollama model: ${this.ollamaModelName}`);
  }
  
  /**
   * Initialize domain-specific context for healthcare domains
   * This enriches prompts with relevant medical context
   */
  private initializeDomainContext(): Record<MedicalDomain, string> {
    return {
      [MedicalDomain.GENERAL]: 'You are a knowledgeable health assistant providing general health information.',
      [MedicalDomain.CARDIOLOGY]: 'You are a cardiology information provider offering guidance on heart health.',
      [MedicalDomain.ENDOCRINOLOGY]: 'You are an endocrinology specialist providing information on hormonal systems.',
      [MedicalDomain.NEUROLOGY]: 'You are a neurology information provider offering guidance on brain and nervous system health.',
      [MedicalDomain.GENETICS]: 'You are a genetics information provider explaining genetic concepts in healthcare.',
      [MedicalDomain.NUTRITION]: 'You are a nutrition expert providing evidence-based dietary advice.',
      [MedicalDomain.IMMUNOLOGY]: 'You are an immunology information provider explaining immune system concepts.',
      [MedicalDomain.GASTROENTEROLOGY]: 'You are a gastroenterology information provider offering guidance on digestive health.',
      [MedicalDomain.LABORATORY]: 'You are a medical lab information provider helping interpret basic lab results.',
      [MedicalDomain.PHARMACOLOGY]: 'You are a pharmacology information provider explaining medication concepts.',
      [MedicalDomain.MICROBIOME]: 'You are a microbiome specialist providing information on gut health and microorganisms.',
    };
  }
  
  /**
   * Check if Ollama is available and the needed model exists
   * Caches the result to avoid redundant checks
   */
  async checkAvailability(): Promise<boolean> {
    // Return cached result if available
    if (this.availabilityCache !== null) {
      return this.availabilityCache;
    }
    
    // Return existing promise if already checking
    if (this.checkPromise) {
      return this.checkPromise;
    }
    
    // Create and cache the promise
    this.checkPromise = (async () => {
      try {
        logger.info(`Checking Ollama availability for model: ${this.ollamaModelName}`);
        
        // First check if Ollama server is available
        const isServerAvailable = await checkOllamaAvailability();
        
        if (!isServerAvailable) {
          logger.warn('Ollama server is not available');
          this.availabilityCache = false;
          return false;
        }
        
        // Then check if the requested model is available
        const models = await listOllamaModels();
        const modelExists = models.some(model => {
          if (typeof model === 'string') {
            return model === this.ollamaModelName || model.includes(this.ollamaModelName);
          } else if (typeof model === 'object' && model !== null && 'name' in model) {
            const ollamaModel = model as OllamaModel;
            return ollamaModel.name === this.ollamaModelName || ollamaModel.name.includes(this.ollamaModelName);
          }
          return false;
        });
        
        if (!modelExists) {
          logger.warn(`Ollama model '${this.ollamaModelName}' not found`);
        } else {
          logger.info(`Ollama model '${this.ollamaModelName}' is available`);
        }
        
        this.availabilityCache = modelExists;
        return modelExists;
      } catch (error) {
        logger.error('Error checking Ollama availability', error);
        this.availabilityCache = false;
        return false;
      } finally {
        // Clear the promise after completion
        this.checkPromise = null;
      }
    })();
    
    return this.checkPromise;
  }
  
  /**
   * Format a medical prompt with domain-specific context and safety instructions
   * Enhanced version that includes medical domain context
   */
  private formatEnhancedMedicalPrompt(prompt: string | BaseMedicalPrompt): string {
    // Start with safe system prompt
    let formattedPrompt = CPU_MODEL_CONFIG.systemPrompt + '\n\n';
    
    // Handle domain-specific medical context
    if (typeof prompt !== 'string') {
      if ('medicalDomain' in prompt && prompt.medicalDomain && this.medicalDomainContext[prompt.medicalDomain]) {
        formattedPrompt += this.medicalDomainContext[prompt.medicalDomain] + '\n\n';
      }
      
      // Add medical disclaimers
      formattedPrompt += MEDICAL_DISCLAIMERS.GENERAL + '\n';
      formattedPrompt += MEDICAL_DISCLAIMERS.EMERGENCY + '\n\n';
      
      // Add the actual user query
      formattedPrompt += 'User Query: ' + (prompt.query || '');
    } else {
      // Add medical disclaimers
      formattedPrompt += MEDICAL_DISCLAIMERS.GENERAL + '\n';
      formattedPrompt += MEDICAL_DISCLAIMERS.EMERGENCY + '\n\n';
      
      // Add the actual user query
      formattedPrompt += 'User Query: ' + prompt;
    }
    
    return formattedPrompt;
  }
  
  /**
   * Complete a prompt with the LLM using Ollama
   * This implementation includes medical safety features
   */
  async complete(prompt: string | BaseMedicalPrompt, options?: LLMOptions): Promise<LLMResponse> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    try {
      // Check Ollama availability
      const isAvailable = await this.checkAvailability();
      
      if (!isAvailable) {
        throw new Error(`Ollama LLM service unavailable for model: ${this.ollamaModelName}`);
      }
      
      // Format medical prompt with safety considerations
      const formattedPrompt = this.formatEnhancedMedicalPrompt(prompt);
      
      logger.info(`Generating completion using Ollama model ${this.ollamaModelName}`);
      logger.debug(`Estimated input tokens: ${this.estimateTokens(formattedPrompt)}`);
      
      // Send request to Ollama
      const response = await generateOllamaCompletion({
        model: this.ollamaModelName,
        prompt: formattedPrompt,
        options: {
          temperature: mergedOptions.temperature,
          num_predict: mergedOptions.maxTokens
        }
      });
      
      const latency = Date.now() - startTime;
      
      // Calculate token usage (input + output)
      const tokensUsed = this.estimateTokens(formattedPrompt) + this.estimateTokens(response.response);
      
      return {
        text: response.response,
        modelName: this.modelName,
        tokensUsed: tokensUsed,
        latencyMs: latency,
        confidence: 0.85, // Default confidence for local model
        provider: 'ollama',
        complete: true
      };
      
    } catch (error) {
      // Log the error and return an error response
      logger.error('Error in CPUMedicalLLM.complete', error);
      
      return {
        text: 'There was an error processing your request with the local medical model. Please try again later.',
        modelName: this.modelName,
        confidence: 0,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        provider: 'error',
        complete: true,
        tokensUsed: 0
      };
    }
  }
  
  /**
   * Stream a response for a given prompt using Ollama
   * Implements streaming via Ollama's streaming API
   */
  async *stream(
    prompt: string | BaseMedicalPrompt,
    options?: LLMOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    try {
      // Check Ollama availability
      const isAvailable = await this.checkAvailability();
      
      if (!isAvailable) {
        const errorChunk: StreamChunk = {
          text: `Ollama service or model '${this.ollamaModelName}' unavailable.`,
          isComplete: true,
          error: `Ollama service unavailable for model: ${this.ollamaModelName}`,
          provider: 'error'
        };
        
        if (onChunk) onChunk(errorChunk);
        yield errorChunk;
        return;
      }
      
      // Format enhanced medical prompt
      const formattedPrompt = this.formatEnhancedMedicalPrompt(prompt);
      
      logger.info(`Streaming completion using Ollama model ${this.ollamaModelName}`);
      
      // Stream response from Ollama
      const ollamaOptions = {
        model: this.ollamaModelName,
        prompt: formattedPrompt,
        options: {
          temperature: mergedOptions.temperature,
          num_predict: mergedOptions.maxTokens
        }
      };
      
      // Process streaming chunks
      for await (const ollamaChunk of streamOllamaCompletion(ollamaOptions)) {
        // Skip empty chunks
        if (!ollamaChunk.response) continue;
        
        const streamChunk: StreamChunk = {
          text: ollamaChunk.response,
          isComplete: ollamaChunk.done || false,
          provider: 'ollama'
        };
        
        // Send chunk to callback if provided
        if (onChunk) onChunk(streamChunk);
        
        // Yield chunk to caller
        yield streamChunk;
      }
      
      // Final chunk with complete flag if not already sent
      const finalChunk: StreamChunk = {
        text: '',
        isComplete: true,
        provider: 'ollama'
      };
      
      if (onChunk) onChunk(finalChunk);
      yield finalChunk;
      
    } catch (error) {
      logger.error('Error in CPUMedicalLLM.stream', error);
      
      // Yield error chunk for graceful failure
      const errorChunk: StreamChunk = {
        text: 'There was an error processing your request with the local medical model.',
        error: error instanceof Error ? error.message : String(error),
        isComplete: true,
        provider: 'error'
      };
      
      if (onChunk) onChunk(errorChunk);
      yield errorChunk;
    }
  }
}
