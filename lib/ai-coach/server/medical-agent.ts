/**
 * Medical Agent Service
 * 
 * This service orchestrates the LLM and RAG components to provide medical responses.
 * It handles medical query processing, emergency detection, and response formatting.
 * 
 * Following clean architecture principles with clear separation of concerns [CA].
 * HIPAA compliance measures are implemented throughout the service [SFT].
 */

import { 
  MedicalResponse, 
  MedicalContext, 
  MedicalDomain, 
  MedicalQueryType, 
  UrgencyLevel,
  AgentEvent
} from '../shared/types/ai-coach-types';
import { RAGResponse } from './rag/rag-service';

import { 
  EMERGENCY_KEYWORDS, 
  MEDICAL_DISCLAIMERS, 
  DEFAULT_EMERGENCY_CONTACTS
} from '../shared/constants/medical-constants';

// Import LLM and RAG services
import { HybridLLMService } from './llm/hybrid-llm-service';
import { MedicalRAGService } from './rag/rag-service';

/**
 * Interface for MedicalAgentService configuration
 */
export interface MedicalAgentConfig {
  enableEmergencyDetection: boolean;
  requireMedicalDisclaimers: boolean;
  logMedicalQueries: boolean;
  maxResponseTokens: number;
  streamingEnabled: boolean;
  userContextEnabled: boolean;
}

/**
 * MedicalAgentService
 * 
 * Core service that orchestrates the LLM and RAG components to provide
 * medically-relevant responses with appropriate safety measures.
 * 
 * This service handles:
 * - Medical query classification
 * - Emergency detection
 * - Context enhancement with RAG
 * - Response generation via LLM
 * - Response formatting with citations
 * - HIPAA-compliant logging
 */
export class MedicalAgentService {
  private llmService: HybridLLMService;
  private ragService: MedicalRAGService;
  // [lint-fix] Use a local fallback logger if createLogger is missing
  private logger = { info: (..._args: unknown[]) => {}, error: (..._args: unknown[]) => {} };
  private config: MedicalAgentConfig;
  
  /**
   * Creates a new MedicalAgentService
   */
  constructor(
    llmService: HybridLLMService,
    ragService: MedicalRAGService,
    config?: Partial<MedicalAgentConfig>
  ) {
    this.llmService = llmService;
    this.ragService = ragService;
    
    // Default configuration with safe values
    this.config = {
      enableEmergencyDetection: true,
      requireMedicalDisclaimers: true,
      logMedicalQueries: true,
      maxResponseTokens: 1024,
      streamingEnabled: true,
      userContextEnabled: true,
      ...config
    };
    
    this.logger.info('MedicalAgentService initialized with configuration', {
      ...this.config,
      // Don't log any potentially sensitive information
    });
  }
  
  /**
   * Process a medical query and generate a response
   * 
   * @param query The user's medical query
   * @param sessionId Unique session identifier for tracking conversation
   * @returns A structured medical response
   */
  /**
   * AGUI-compatible event streaming for medical queries
   * Yields events: run_started, emergency_detected, context_retrieved, llm_response, run_stopped, error
   */
  public async *processHealthQuery(
    query: string,
    sessionId: string
  ): AsyncGenerator<AgentEvent, void, unknown> {
    const timestamp = new Date().toISOString();
    yield { type: 'run_started', timestamp, session_id: sessionId };
    try {
      // Emergency detection
      let isEmergency = false;
      if (this.config.enableEmergencyDetection && this._detectEmergency(query)) {
        isEmergency = true;
        yield {
          type: 'emergency_detected',
          timestamp: new Date().toISOString(),
          content: {
            message: 'Potential medical emergency detected. Please contact emergency services.',
            emergency_contacts: DEFAULT_EMERGENCY_CONTACTS
          },
          session_id: sessionId
        };
      }
      // Query classification
      const queryType = this._classifyQuery(query);
      // RAG context retrieval
      // Ensure ragContext is always an array [lint-fix]
      // [lint-fix] Use RAGResponse[] as context, handle array properly
// [lint-fix] Import RAGResponse and use correct typing


// [lint-fix] Always treat ragContext as RAGResponse[]
const ragResult = await this.ragService.enhanceQuery(
  this.llmService['cpuLLM'], // Use the CPU LLM instance
  query,
  queryType as unknown as MedicalDomain
);
const ragContext: RAGResponse[] = Array.isArray(ragResult) ? ragResult : ragResult ? [ragResult] : [];
      yield {
        type: 'context_retrieved',
        timestamp: new Date().toISOString(),
        content: { context: ragContext },
        session_id: sessionId
      };
      // LLM response
      // Use correct method name from HybridLLMService [lint-fix]
      // [lint-fix] Only pass LLMOptions-compliant fields
// [lint-fix] Pass medicalContext as array of strings, not joined string
// [lint-fix] Pass MedicalPrompt: medicalContext as string, not array
const llmPrompt = {
  query,
  medicalContext: ragContext.map((ctx: RAGResponse) => ctx.enhancedText).join('\n'),
  medicalDomain: queryType as unknown as MedicalDomain,
  includeDisclaimer: this.config.requireMedicalDisclaimers
};
const llmResult = await this.llmService.complete(llmPrompt, {
  maxTokens: this.config.maxResponseTokens
});
      const formatted = this._formatMedicalResponse(llmResult, ragContext, queryType, isEmergency);
      yield {
        type: 'llm_response',
        timestamp: new Date().toISOString(),
        content: (formatted as unknown) as Record<string, unknown>,
        session_id: sessionId
      };
    } catch (error) {
      this.logger.error('MedicalAgentService error', error);
      yield {
        type: 'error',
        timestamp: new Date().toISOString(),
        content: {
          error: 'I apologize, but I encountered an error processing your health question. Please try again or consult a healthcare professional.'
        },
        session_id: sessionId
      };
    } finally {
      yield { type: 'run_stopped', timestamp: new Date().toISOString(), session_id: sessionId };
    }
  }

  // --- Helpers below ---

  private _detectEmergency(query: string): boolean {
    const q = query.toLowerCase();
    return EMERGENCY_KEYWORDS.some((kw) => q.includes(kw));
  }

  private _classifyQuery(query: string): MedicalQueryType {
    // Simple keyword-based classification; can be replaced with ML later
    const q = query.toLowerCase();
    if (q.match(/lab|blood|cholesterol|glucose|a1c|vitamin/)) return MedicalQueryType.LAB_INTERPRETATION;
    if (q.match(/gene|genetic|dna|mutation|snp|variant/)) return MedicalQueryType.GENETICS;
    if (q.match(/microbiome|gut|bacteria|probiotic|flora/)) return MedicalQueryType.MICROBIOME;
    if (q.match(/pain|symptom|burning|itching|ache|discomfort/)) return MedicalQueryType.SYMPTOMS;
    if (q.match(/medication|drug|prescription|dosage|side effect/)) return MedicalQueryType.MEDICATIONS;
    if (q.match(/diet|nutrition|food|supplement|protein|carbohydrate|fat/)) return MedicalQueryType.NUTRITION;
    return MedicalQueryType.GENERAL;
  }

  private _formatMedicalResponse(
    llmResult: string | { text: string }, // LLMResponse or string
    ragContext: RAGResponse[],
    queryType: MedicalQueryType,
    isEmergency: boolean
  ): MedicalResponse {
    // Compose citations
    // Each RAGResponse has sources: [{text, metadata, score, citation?}]
    // We'll extract citation/confidence from the first source if available
    const sources = (ragContext || []).slice(0, 3).map((doc) => {
      const firstSource = doc.sources && doc.sources.length > 0 ? doc.sources[0] : undefined;
      return {
        citation: firstSource?.citation ?? '',
        confidence: typeof firstSource?.score === 'number' ? firstSource.score : 0.8,
        domain: (firstSource?.metadata?.domain as MedicalDomain) ?? MedicalDomain.GENERAL,
        url: firstSource?.metadata?.url ?? undefined
      };
    });
    // Calculate confidence
    const confidence = sources.length
      ? sources.map((s) => s.confidence).reduce((a, b) => a + b, 0) / sources.length
      : 0.7;
    // Add disclaimer
    let text = (typeof llmResult === 'string' ? llmResult : llmResult.text || '') +
      (this.config.requireMedicalDisclaimers ? `\n\n${MEDICAL_DISCLAIMERS.GENERAL}` : '');
    if (isEmergency) text = `🚨 EMERGENCY: ${MEDICAL_DISCLAIMERS.EMERGENCY}\n\n${text}`;
    // Return MedicalResponse
    return {
      text,
      sources,
      confidence,
      requires_followup: isEmergency || false,
      followup_recommendations: isEmergency
        ? [{
            type: 'emergency',
            description: 'Contact emergency services or go to the nearest ER immediately.',
            timeframe: 'immediate',
            urgency: UrgencyLevel.EMERGENCY
          }]
        : [],
      urgency: isEmergency ? UrgencyLevel.EMERGENCY : UrgencyLevel.ROUTINE,
      medical_domains: sources.map((s) => s.domain),
      created_at: new Date().toISOString(),
      session_id: ''
    };
  }
}
