/**
 * Hybrid LLM Service
 * 
 * Combines local CPU-based inference with cloud fallback for robustness.
 * Implements a graceful degradation strategy to ensure service reliability [REH].
 */

import { LLMOptions, LLMResponse, MedicalPrompt, StreamChunk } from './base-llm';
import { CPUMedicalLLM } from './cpu-medical-llm';
import { OpenAIFallbackLLM } from './openai-fallback-llm';
import { MedicalDomain } from '../../shared/types/ai-coach-types';

/**
 * Configuration for the hybrid LLM service
 */
export interface HybridLLMConfig {
  useFallback: boolean;
  fallbackThreshold: number;
  enableCache: boolean;
  cacheTTLSeconds: number;
  timeoutMs: number;
}

/**
 * Cache entry type for response caching
 */
export interface CacheEntry {
  response: LLMResponse;
  timestamp: number;
  prompt: string;
  domain?: MedicalDomain;
}

/**
 * HybridLLMService - Intelligent routing between local and cloud LLMs
 */
export class HybridLLMService {
  private cpuLLM: CPUMedicalLLM;
  private fallbackLLM: OpenAIFallbackLLM;
  private config: HybridLLMConfig;
  private responseCache: Map<string, CacheEntry>;
  
  /**
   * Initialize the hybrid LLM service with both local and cloud providers
   */
  constructor(
    cpuLLM?: CPUMedicalLLM,
    fallbackLLM?: OpenAIFallbackLLM,
    config?: Partial<HybridLLMConfig>
  ) {
    this.cpuLLM = cpuLLM || new CPUMedicalLLM();
    this.fallbackLLM = fallbackLLM || new OpenAIFallbackLLM();
    
    // Default configuration
    this.config = {
      useFallback: true,
      fallbackThreshold: 0.7, // Confidence threshold to trigger fallback
      enableCache: true,
      cacheTTLSeconds: 3600, // 1 hour cache TTL
      timeoutMs: 15000, // 15 second timeout for CPU model
      ...config
    };
    
    // Initialize response cache
    this.responseCache = new Map<string, CacheEntry>();
  }
  
  /**
   * Complete a prompt using the appropriate LLM service based on complexity
   */
  async complete(prompt: string | MedicalPrompt, options?: LLMOptions): Promise<LLMResponse> {
    // Check cache first if enabled
    if (this.config.enableCache) {
      const cachedResponse = this.getCachedResponse(prompt);
      if (cachedResponse) return cachedResponse;
    }
    
    // Try CPU model first with timeout
    try {
      const cpuResponse = await this.withTimeout(
        this.cpuLLM.complete(prompt, options),
        this.config.timeoutMs
      );
      
      // Check if we should fallback based on confidence or completeness
      if (
        this.config.useFallback && 
        (
          (typeof cpuResponse.confidence === 'number' && cpuResponse.confidence < this.config.fallbackThreshold) ||
          !cpuResponse.complete ||
          this.shouldFallbackBasedOnContent(cpuResponse.text, prompt)
        )
      ) {
        console.log('CPU model response below confidence threshold, falling back to cloud provider');
        return this.fallbackLLM.complete(prompt, options).then(response => {
          // Cache the fallback response
          if (this.config.enableCache) {
            this.cacheResponse(prompt, response);
          }
          return response;
        });
      }
      
      // Cache the CPU response
      if (this.config.enableCache) {
        this.cacheResponse(prompt, cpuResponse);
      }
      
      return cpuResponse;
    } catch (error) {
      console.warn('CPU model failed or timed out, falling back to cloud provider:', error);
      
      // If CPU model fails or times out, use fallback if enabled
      if (this.config.useFallback) {
        return this.fallbackLLM.complete(prompt, options).then(response => {
          // Cache the fallback response
          if (this.config.enableCache) {
            this.cacheResponse(prompt, response);
          }
          return response;
        });
      }
      
      // If fallback is disabled, propagate the error
      throw error;
    }
  }
  
  /**
   * Stream a response from the appropriate LLM service
   */
  async *stream(
    prompt: string | MedicalPrompt,
    options?: LLMOptions,
    onChunk?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    // Try CPU model first, with fallback handling
    try {
      // For streaming, we need to make a quick assessment if we should use CPU or fallback
      // For simplicity in this implementation, we'll use a pre-check
      const shouldUseFallback = await this.shouldPreemptivelyFallback(prompt);
      
      let streamGenerator;
      if (shouldUseFallback && this.config.useFallback) {
        console.log('Preemptively using fallback for streaming based on prompt assessment');
        streamGenerator = this.fallbackLLM.stream(prompt, options, onChunk);
      } else {
        streamGenerator = this.withStreamTimeout(
          prompt,
          this.cpuLLM.stream(prompt, options),
          this.config.timeoutMs,
          onChunk
        );
      }
      
      // Forward all chunks from the selected generator
      for await (const chunk of streamGenerator) {
        yield chunk;
        
        // Check if we should switch to fallback after initial chunks
        // This is a simplified implementation - in practice this would be more complex
        if (
          !shouldUseFallback &&
          this.config.useFallback &&
          chunk.text &&
          this.shouldFallbackBasedOnContent(chunk.text, prompt)
        ) {
          console.log('Switching to fallback during streaming based on initial content');
          
          // Signal that we're switching providers
          const switchingChunk: StreamChunk = {
            text: "\n[Switching to enhanced medical model for better accuracy...]\n",
            isComplete: false
          };
          
          if (onChunk) {
            onChunk(switchingChunk);
          }
          
          yield switchingChunk;
          
          // Start fallback stream with enhanced context
          const enhancedPrompt = this.enhancePromptWithContext(prompt, chunk.text);
          const fallbackGenerator = this.fallbackLLM.stream(enhancedPrompt, options, onChunk);
          
          // Forward all remaining chunks from fallback
          for await (const fallbackChunk of fallbackGenerator) {
            yield fallbackChunk;
          }
          
          // Exit early as we've switched providers
          return;
        }
      }
    } catch (error) {
      console.warn('CPU model streaming failed, falling back to cloud provider:', error);
      
      // If CPU streaming fails and fallback is enabled, switch to fallback
      if (this.config.useFallback) {
        // Signal the switch to the user
        const errorChunk: StreamChunk = {
          text: "\n[Switching to enhanced medical model due to technical issue...]\n",
          isComplete: false
        };
        
        if (onChunk) {
          onChunk(errorChunk);
        }
        
        yield errorChunk;
        
        // Use fallback for streaming
        for await (const chunk of this.fallbackLLM.stream(prompt, options, onChunk)) {
          yield chunk;
        }
      } else {
        // If fallback is disabled, yield an error chunk
        const errorChunk: StreamChunk = {
          text: "",
          isComplete: true,
          error: "Unable to generate response. Please try again later."
        };
        
        if (onChunk) {
          onChunk(errorChunk);
        }
        
        yield errorChunk;
      }
    }
  }
  
  /**
   * Assess if a prompt should immediately use fallback before attempting CPU model
   * This is a heuristic to avoid wasting time on complex queries the CPU model will struggle with
   */
  private async shouldPreemptivelyFallback(prompt: string | MedicalPrompt): Promise<boolean> {
    const queryText = typeof prompt === 'string' ? prompt : prompt.query;
    
    // Check for indicators of complex medical queries that local models might struggle with
    const complexityIndicators = [
      'differential diagnosis',
      'complex interaction',
      'treatment protocol',
      'rare disease',
      'genetic mutation',
      'multiple conditions',
      'contradictory symptoms',
      'clinical trial',
      'research literature'
    ];
    
    // Check query length as a proxy for complexity
    const isLongQuery = queryText.length > 500;
    
    // Check for medical domain complexity
    const medicalDomain = typeof prompt !== 'string' && prompt.medicalDomain ? prompt.medicalDomain : '';
    const isComplexDomain = medicalDomain === MedicalDomain.GENETICS || 
                           medicalDomain === MedicalDomain.IMMUNOLOGY;
    
    // Check for complexity indicators in the text
    const hasComplexityMarker = complexityIndicators.some(indicator => 
      queryText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    return isLongQuery || isComplexDomain || hasComplexityMarker;
  }
  
  /**
   * Check if content quality suggests we should fallback
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
private shouldFallbackBasedOnContent(content: string, prompt: string | MedicalPrompt): boolean {
    if (!content) return true;
    
    // Check for indicators of low quality or uncertain responses
    const lowQualityIndicators = [
      "I'm not sure",
      "I don't have enough information",
      "I cannot provide",
      "beyond my capabilities",
      "limited knowledge",
      "cannot answer",
      "difficult to determine"
    ];
    
    return lowQualityIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  /**
   * Enhance a prompt with information from initial response
   */
  private enhancePromptWithContext(
    originalPrompt: string | MedicalPrompt,
    initialResponse: string
  ): MedicalPrompt {
    if (typeof originalPrompt === 'string') {
      return {
        query: originalPrompt,
        medicalContext: `Previous incomplete response: ${initialResponse}`,
        includeDisclaimer: true
      };
    }
    
    return {
      ...originalPrompt,
      medicalContext: originalPrompt.medicalContext 
        ? `${originalPrompt.medicalContext}\nPrevious incomplete response: ${initialResponse}`
        : `Previous incomplete response: ${initialResponse}`
    };
  }
  
  /**
   * Add timeout to a promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      promise.then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Add timeout to an async generator with onChunk handling
   */
  private async *withStreamTimeout(prompt: string | MedicalPrompt, stream: AsyncGenerator<StreamChunk>, timeoutMs: number, onChunk?: (chunk: StreamChunk) => void): AsyncGenerator<StreamChunk> {
    const timeoutPromise = new Promise<StreamChunk>((_, reject) => {
      setTimeout(() => {
        const errorChunk: StreamChunk = {
          text: "",
          isComplete: true,
          error: `Streaming timed out after ${timeoutMs}ms`
        };
        
        if (onChunk) {
          onChunk(errorChunk);
        }
        
        reject(new Error(`Streaming timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    let isDone = false;
    while (!isDone) {
      try {
        // Create a promise that resolves with the next chunk or rejects on timeout
        const nextChunkPromise = stream.next().then((result: IteratorResult<StreamChunk>) => {
          isDone = result.done || false;
          return result.value;
        });
        // Race between the next chunk and timeout
        const chunk = await Promise.race([nextChunkPromise, timeoutPromise]);
        yield chunk;
      } catch (error) {
        isDone = true;
        throw error;
      }
    }
  }
  
  /**
   * Generate a cache key for a prompt
   */
  private getCacheKey(prompt: string | MedicalPrompt): string {
    if (typeof prompt === 'string') {
      return `str:${prompt}`;
    }
    
    return `med:${prompt.medicalDomain || 'general'}:${typeof prompt.query === 'string' ? prompt.query : ''}`;
  }
  
  /**
   * Get a cached response if available and valid
   */
  private getCachedResponse(prompt: string | MedicalPrompt): LLMResponse | null {
    const key = this.getCacheKey(prompt);
    const cached = this.responseCache.get(key);
    
    if (!cached) return null;
    
    // Check if cache entry is still valid
    const now = Date.now();
    const ageSeconds = (now - cached.timestamp) / 1000;
    
    if (ageSeconds > this.config.cacheTTLSeconds) {
      // Remove expired cache entry
      this.responseCache.delete(key);
      return null;
    }
    
    return cached.response;
  }
  
  /**
   * Cache a response for future use
   */
  private cacheResponse(prompt: string | MedicalPrompt, response: LLMResponse): void {
    const key = this.getCacheKey(prompt);
    
    // Only cache successful and complete responses
    if (response.error || !response.complete) return;
    
    this.responseCache.set(key, {
      response,
      timestamp: Date.now(),
      prompt: typeof prompt === 'string' ? prompt : (typeof prompt.query === 'string' ? prompt.query : '') || '',
      ...(typeof prompt !== 'string' && prompt.medicalDomain ? { domain: prompt.medicalDomain } : {})
    });
    
    // Prune cache if it gets too large (simple LRU-like behavior)
    if (this.responseCache.size > 1000) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }
}
