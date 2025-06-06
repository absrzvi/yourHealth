/**
 * RAG Service
 * 
 * Retrieval-Augmented Generation service for enriching medical LLM responses
 * with relevant knowledge from the vector database [CA, PA].
 */

import { BaseLLM, MedicalPrompt } from '../llm/base-llm';
import { VectorStore, SearchParams, SearchResult, DocumentMetadata } from './vector-store';
import { MedicalDomain } from '../../shared/types/ai-coach-types';
import { RAG_CONFIG } from '../../shared/constants/medical-constants';

/**
 * Configuration for the RAG service
 */
export interface RAGServiceConfig {
  maxDocuments: number;
  minRelevanceScore: number;
  includeSourceInfo: boolean;
  reranking: boolean;
  domainBoost: boolean;
}

/**
 * Enhanced response with sources from RAG system
 */
export interface RAGResponse {
  enhancedText: string;
  sources: Array<{
    text: string;
    metadata: DocumentMetadata;
    score: number;
    citation?: string;
  }>;
  enhancementApplied: boolean;
}

/**
 * Medical RAG Service implementation
 */
export class MedicalRAGService {
  private vectorStore: VectorStore;
  private config: RAGServiceConfig;
  
  /**
   * Initialize the RAG service
   */
  constructor(vectorStore: VectorStore, config?: Partial<RAGServiceConfig>) {
    this.vectorStore = vectorStore;
    
    // Default configuration for medical knowledge retrieval
    this.config = {
      maxDocuments: RAG_CONFIG.TOP_K,
      minRelevanceScore: RAG_CONFIG.SCORE_THRESHOLD,
      includeSourceInfo: true,
      reranking: true,
      domainBoost: true,
      ...config
    };
  }
  
  /**
   * Enhance a medical query with relevant knowledge and generate a response
   */
  async enhanceQuery(
    llm: BaseLLM,
    query: string,
    domain?: MedicalDomain,
    additionalContext?: string
  ): Promise<RAGResponse> {
    try {
      // Retrieve relevant documents from vector store
      const searchResults = await this.retrieveRelevantDocuments(query, domain);
      
      if (!searchResults.length) {
        // No relevant documents found, use original query
        console.log('No relevant documents found for RAG enhancement');
        
        const response = await llm.complete(query);
        
        return {
          enhancedText: response.text,
          sources: [],
          enhancementApplied: false
        };
      }
      
      // Process and rerank results if enabled
      const processedResults = this.config.reranking 
        ? this.rerankResults(searchResults, query, domain)
        : searchResults;
      
      // Format documents as context for the prompt
      const context = this.formatDocumentsAsContext(processedResults);
      
      // Create enhanced prompt with retrieved context
      const enhancedPrompt: MedicalPrompt = {
        query,
        medicalDomain: domain,
        medicalContext: additionalContext,
        referenceContext: context,
        includeDisclaimer: true
      };
      
      // Generate LLM response with enhanced context
      const response = await llm.complete(enhancedPrompt);
      
      // Format sources for the response
      const sources = processedResults.map(result => ({
        text: result.document.text,
        metadata: result.document.metadata,
        score: result.score,
        citation: result.document.metadata.citation
      }));
      
      return {
        enhancedText: response.text,
        sources,
        enhancementApplied: true
      };
    } catch (error) {
      console.error('Error in RAG enhancement:', error);
      
      // Handle errors gracefully [REH]
      throw new Error(`Failed to enhance query with relevant knowledge: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`);
    }
  }
  
  /**
   * Stream an enhanced response
   */
  async streamEnhancedResponse(
    llm: BaseLLM, 
    query: string,
    domain?: MedicalDomain,
    additionalContext?: string,
    onChunk?: (chunk: any) => void
  ): Promise<AsyncGenerator<any>> {
    try {
      // Retrieve relevant documents
      const searchResults = await this.retrieveRelevantDocuments(query, domain);
      
      // Process and rerank results if enabled
      const processedResults = this.config.reranking 
        ? this.rerankResults(searchResults, query, domain)
        : searchResults;
      
      // Format documents as context
      const context = this.formatDocumentsAsContext(processedResults);
      
      // Create enhanced prompt
      const enhancedPrompt: MedicalPrompt = {
        query,
        medicalDomain: domain,
        medicalContext: additionalContext,
        referenceContext: context,
        includeDisclaimer: true
      };
      
      // Stream the enhanced response
      return llm.stream(enhancedPrompt, { streaming: true }, onChunk);
    } catch (error) {
      console.error('Error in RAG streaming:', error);
      
      // Handle streaming errors gracefully [REH]
      const errorGenerator = async function* () {
        yield {
          text: `Error enhancing response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isComplete: true,
          error: true
        };
      };
      
      return errorGenerator();
    }
  }
  
  /**
   * Retrieve relevant documents based on the query
   */
  private async retrieveRelevantDocuments(
    query: string,
    domain?: MedicalDomain
  ): Promise<SearchResult[]> {
    // Configure search parameters with domain-specific boosts if enabled [PA]
    const searchParams: SearchParams = {
      topK: this.config.maxDocuments,
      scoreThreshold: this.config.minRelevanceScore,
      includeVectors: false
    };
    
    // Apply domain filter if specified
    if (domain && this.config.domainBoost) {
      searchParams.filter = {
        domains: [domain],
        minReliability: 0.7, // Require higher reliability for medical information
      };
    }
    
    // Search the vector store
    const results = await this.vectorStore.search(query, searchParams);
    
    return results;
  }
  
  /**
   * Rerank search results based on additional criteria beyond vector similarity [PA]
   */
  private rerankResults(
    results: SearchResult[],
    query: string,
    domain?: MedicalDomain
  ): SearchResult[] {
    if (!results.length) return results;
    
    // Apply additional scoring factors
    const rerankResults = results.map((result: any) => {
      let adjustedScore = result.score;
      const doc = result.document;
      
      // Boost by source reliability
      if (doc.metadata.reliability) {
        adjustedScore *= doc.metadata.reliability;
      }
      
      // Boost by source trust level
      const source = doc.metadata.source;
      
      
      // Boost by domain match if applicable
      if (domain && doc.metadata.domain === domain) {
        adjustedScore *= 1.2; // 20% boost for matching domain
      }
      
      // Simple relevance by term matching (could be replaced with more sophisticated methods)
      const queryTerms = query.toLowerCase().split(/\s+/);
      const textTerms = doc.text.toLowerCase().split(/\s+/);
      const termMatches = queryTerms.filter(term => textTerms.includes(term)).length;
      const termMatchScore = queryTerms.length > 0 ? termMatches / queryTerms.length : 0;
      
      // Incorporate term matching into score
      adjustedScore = (adjustedScore * 0.7) + (termMatchScore * 0.3);
      
      // Normalize to 0-1 range
      adjustedScore = Math.min(1, Math.max(0, adjustedScore));
      
      return {
        ...result,
        score: adjustedScore
      };
    });
    
    // Sort by adjusted score
    return rerankResults.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Format documents as context strings for the LLM prompt
   */
  private formatDocumentsAsContext(results: SearchResult[]): string[] {
    return results.map((result, index) => {
      const doc = result.document;
      let context = doc.text;
      // Add source information if enabled
      if (this.config.includeSourceInfo && doc.metadata) {
        const { source, citation } = doc.metadata;
        if (citation) {
          context += ` [Source: ${citation}]`;
        } else if (source) {
          context += ` [Source: ${source}]`;
        }
      }
      return context;
    });
  }
}
