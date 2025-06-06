/**
 * Vector Store Service
 * 
 * Provides an abstraction layer for vector database operations,
 * optimized for medical knowledge retrieval with HIPAA compliance in mind [SFT].
 */

import { RAG_CONFIG } from '../../shared/constants/medical-constants';
import { MedicalDomain } from '../../shared/types/ai-coach-types';

/**
 * Document with embedded vector representation
 */
export interface VectorDocument {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  vector?: number[];
}

/**
 * Metadata for medical documents
 */
export interface DocumentMetadata {
  source: string;
  domain: MedicalDomain;
  date?: string;
  author?: string;
  reliability?: number; // 0-1 score for source reliability
  tags?: string[];
  citation?: string;
  url?: string; // Optional URL for source reference [SF][ISA]
}

/**
 * Search results from the vector store
 */
export interface SearchResult {
  document: VectorDocument;
  score: number; // Similarity score
  distance?: number; // Vector distance (lower is better)
}

/**
 * Search parameters
 */
export interface SearchParams {
  topK?: number;
  scoreThreshold?: number;
  filter?: DocumentFilter;
  includeVectors?: boolean;
}

/**
 * Filter for document search
 */
export interface DocumentFilter {
  domains?: MedicalDomain[];
  minReliability?: number;
  sources?: string[];
  tags?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * Abstract class for vector store implementations
 */
export abstract class VectorStore {
  protected dimensions: number;
  protected collectionName: string;
  
  constructor(collectionName: string, dimensions: number = RAG_CONFIG.VECTOR_DIMENSION) {
    this.collectionName = collectionName;
    this.dimensions = dimensions;
  }
  
  /**
   * Add documents to the vector store
   */
  abstract addDocuments(documents: VectorDocument[]): Promise<string[]>;
  
  /**
   * Search for similar documents
   */
  abstract search(
    query: string | number[],
    params?: SearchParams
  ): Promise<SearchResult[]>;
  
  /**
   * Get documents by their IDs
   */
  abstract getDocuments(ids: string[]): Promise<VectorDocument[]>;
  
  /**
   * Delete documents from the store
   */
  abstract deleteDocuments(ids: string[]): Promise<boolean>;
  
  /**
   * Initialize the vector store
   */
  abstract initialize(): Promise<void>;
}

/**
 * Mock implementation for development purposes (to be replaced with actual implementation)
 */
export class MockVectorStore extends VectorStore {
  private documents: Map<string, VectorDocument>;
  
  constructor(collectionName: string, dimensions: number = RAG_CONFIG.VECTOR_DIMENSION) {
    super(collectionName, dimensions);
    this.documents = new Map<string, VectorDocument>();
  }
  
  async initialize(): Promise<void> {
    console.log(`Initializing mock vector store: ${this.collectionName}`);
    // Add some sample medical documents
    await this.addSampleDocuments();
  }
  
  async addDocuments(documents: VectorDocument[]): Promise<string[]> {
    const ids: string[] = [];
    
    for (const doc of documents) {
      const id = doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      this.documents.set(id, {
        ...doc,
        id,
        // Mock random vector if not provided
        vector: doc.vector || Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1)
      });
      ids.push(id);
    }
    
    console.log(`Added ${documents.length} documents to mock vector store`);
    return ids;
  }
  
  async search(query: string | number[], params: SearchParams = {}): Promise<SearchResult[]> {
    const { topK = 5, scoreThreshold = 0.7, filter } = params;
    
    // Convert all documents to array
    const allDocs = Array.from(this.documents.values());
    
    // Apply filters if specified
    let filteredDocs = allDocs;
    if (filter) {
      filteredDocs = this.applyFilters(allDocs, filter);
    }
    
    // In a real implementation, we would compute actual vector similarities
    // Here, we simulate similarity scores based on simple text matching or domain matching
    const scoredResults = filteredDocs.map(doc => {
      let score = 0;
      
      // Simple naive text matching for the mock implementation
      if (typeof query === 'string') {
        const queryTerms = query.toLowerCase().split(' ');
        const docTerms = doc.text.toLowerCase().split(' ');
        
        // Count matching terms
        let matchCount = 0;
        for (const term of queryTerms) {
          if (docTerms.includes(term)) {
            matchCount++;
          }
        }
        
        // Calculate simple relevance score
        score = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
        
        // Boost score for document with matching domain if relevant
        const domainMatch = query.toLowerCase().includes(doc.metadata.domain.toLowerCase());
        if (domainMatch) {
          score += 0.2; // Boost for domain relevance
        }
      } else {
        // For vector queries, generate a random similarity score
        // In real implementation, this would be cosine similarity or distance calculation
        score = 0.5 + (Math.random() * 0.5); // Random score between 0.5 and 1.0
      }
      
      // Normalize to 0-1 range
      score = Math.min(1, Math.max(0, score));
      
      return {
        document: params.includeVectors ? doc : { ...doc, vector: undefined },
        score,
        distance: 1 - score // Simulated distance (lower is better)
      };
    });
    
    // Filter by score threshold
    const thresholdResults = scoredResults.filter(result => result.score >= scoreThreshold);
    
    // Sort by score (descending) and take top K
    const sortedResults = thresholdResults.sort((a, b) => b.score - a.score).slice(0, topK);
    
    return sortedResults;
  }
  
  async getDocuments(ids: string[]): Promise<VectorDocument[]> {
    return ids
      .map(id => this.documents.get(id))
      .filter(Boolean) as VectorDocument[];
  }
  
  async deleteDocuments(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      this.documents.delete(id);
    }
    console.log(`Deleted ${ids.length} documents from mock vector store`);
    return true;
  }
  
  /**
   * Apply filters to documents
   */
  private applyFilters(docs: VectorDocument[], filter: DocumentFilter): VectorDocument[] {
    return docs.filter(doc => {
      // Filter by domains
      if (filter.domains && filter.domains.length > 0) {
        if (!filter.domains.includes(doc.metadata.domain)) {
          return false;
        }
      }
      
      // Filter by reliability score
      if (filter.minReliability !== undefined) {
        if (!doc.metadata.reliability || doc.metadata.reliability < filter.minReliability) {
          return false;
        }
      }
      
      // Filter by sources
      if (filter.sources && filter.sources.length > 0) {
        if (!filter.sources.includes(doc.metadata.source)) {
          return false;
        }
      }
      
      // Filter by tags
      if (filter.tags && filter.tags.length > 0 && doc.metadata.tags) {
        if (!filter.tags.some(tag => doc.metadata.tags?.includes(tag))) {
          return false;
        }
      }
      
      // Filter by date range
      if (filter.dateRange && doc.metadata.date) {
        const docDate = new Date(doc.metadata.date).getTime();
        
        if (filter.dateRange.start) {
          const startDate = new Date(filter.dateRange.start).getTime();
          if (docDate < startDate) {
            return false;
          }
        }
        
        if (filter.dateRange.end) {
          const endDate = new Date(filter.dateRange.end).getTime();
          if (docDate > endDate) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * Add sample medical documents for development
   */
  private async addSampleDocuments(): Promise<void> {
    const sampleDocs: VectorDocument[] = [
      {
        id: 'doc-1',
        text: 'Regular physical activity can help prevent heart disease, stroke, diabetes, and several forms of cancer, including colon and breast cancer.',
        metadata: {
          source: 'CDC Health Guidelines',
          domain: MedicalDomain.GENERAL,
          reliability: 0.95,
          citation: 'Centers for Disease Control and Prevention (2022). Benefits of Physical Activity.',
          tags: ['exercise', 'prevention', 'health'],
          url: 'https://www.cdc.gov/physicalactivity/basics/pa-health/index.htm' // Example URL
        }
      },
      {
        id: 'doc-2',
        text: 'Elevated LDL cholesterol levels increase the risk of heart disease and stroke. Target LDL levels should generally be below 100 mg/dL for optimal cardiovascular health.',
        metadata: {
          source: 'American Heart Association',
          domain: MedicalDomain.CARDIOLOGY,
          reliability: 0.93,
          citation: 'American Heart Association (2023). Cholesterol Guidelines and Recommendations.',
          tags: ['cholesterol', 'heart disease', 'cardiovascular'],
          url: 'https://www.heart.org/en/health-topics/cholesterol' // Example URL
        }
      },
      {
        id: 'doc-3',
        text: 'Type 2 diabetes occurs when the body becomes resistant to insulin or doesn\'t make enough insulin. Risk factors include obesity, family history, and physical inactivity.',
        metadata: {
          source: 'National Institute of Diabetes',
          domain: MedicalDomain.ENDOCRINOLOGY,
          reliability: 0.91,
          citation: 'National Institute of Diabetes and Digestive and Kidney Diseases (2021). Type 2 Diabetes Overview.',
          tags: ['diabetes', 'insulin resistance', 'metabolic'],
          url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/type-2-diabetes' // Example URL
        }
      },
      {
        id: 'doc-4',
        text: 'The gut microbiome consists of trillions of microorganisms including bacteria, fungi, and viruses. A diverse microbiome is associated with better health outcomes.',
        metadata: {
          source: 'Microbiome Research Journal',
          domain: MedicalDomain.MICROBIOME,
          reliability: 0.85,
          citation: 'Johnson et al. (2022). Gut Microbiome Diversity and Health Outcomes. Microbiome Research Journal, 15(3), 234-251.',
          tags: ['microbiome', 'gut health', 'bacteria'],
          url: 'https://www.microbiomejournal.com/content/15/3/234' // Example URL
        }
      },
      {
        id: 'doc-5',
        text: 'A complete blood count (CBC) measures several components of your blood including red and white blood cells, hemoglobin, and platelets. It can detect anemia, infection, and other disorders.',
        metadata: {
          source: 'Laboratory Medicine',
          domain: MedicalDomain.LABORATORY,
          reliability: 0.92,
          citation: 'American Association for Clinical Chemistry (2023). Complete Blood Count Explained.',
          tags: ['blood test', 'diagnostics', 'hematology'],
          url: 'https://www.aacc.org/clinical-chemistry/complete-blood-count' // Example URL
        }
      }
    ];
    
    await this.addDocuments(sampleDocs);
  }
}
