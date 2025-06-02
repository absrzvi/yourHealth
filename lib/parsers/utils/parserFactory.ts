// lib/parsers/utils/ParserFactory.ts

import { BloodTestParser } from '../bloodTestParser';
import { StreamingBloodTestParser } from '../streaming/StreamingBloodTestParser';
// Import the extension to add dispose methods to BloodTestParser
import '../bloodTestParserExtension';

// Define a common interface for both parser types
export interface Parser {
  dispose(): void;
  isDisposed(): boolean;
}

export interface ParserOptions {
  enableMonitoring?: boolean;
  enableLogging?: boolean;
  logLevel?: string;
  chunkSize?: number;
  maxMemoryMB?: number;
}

export type ParserType = 'legacy' | 'streaming';

/**
 * Factory for creating blood test parsers with consistent configuration
 */
export class ParserFactory {
  private static defaultOptions: Required<ParserOptions> = {
    enableMonitoring: false,
    enableLogging: false,
    logLevel: 'info',
    chunkSize: 10000,
    maxMemoryMB: 100
  };
  
  /**
   * Create a legacy BloodTestParser
   */
  static createLegacyParser(content: string, options: ParserOptions = {}): BloodTestParser {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return new BloodTestParser(content, mergedOptions);
  }
  
  /**
   * Create a streaming parser
   */
  static createStreamingParser(options: ParserOptions = {}): StreamingBloodTestParser {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return new StreamingBloodTestParser(mergedOptions);
  }
  
  /**
   * Create a parser of the specified type
   */
  static createParser(type: ParserType, content: string, options: ParserOptions = {}): BloodTestParser | StreamingBloodTestParser {
    if (type === 'legacy') {
      return this.createLegacyParser(content, options);
    } else {
      const parser = this.createStreamingParser(options);
      return parser;
    }
  }
  
  /**
   * Dispose a parser safely
   */
  static safeDispose(parser: BloodTestParser | StreamingBloodTestParser): void {
    try {
      // Use type assertion since we know these methods exist at runtime
      const p = parser as unknown as Parser;
      if (p && typeof p.isDisposed === 'function' && !p.isDisposed()) {
        p.dispose();
      }
    } catch (e) {
      console.warn('Error disposing parser:', e);
    }
  }

  
  /**
   * Auto-select parser based on content size
   */
  static autoSelectParser(content: string, options: ParserOptions = {}): BloodTestParser | StreamingBloodTestParser {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Use streaming parser for large content (>50KB)
    if (content.length > 50000) {
      console.log(`[ParserFactory] Using streaming parser for large content (${content.length} chars)`);
      return this.createStreamingParser(mergedOptions);
    } else {
      console.log(`[ParserFactory] Using legacy parser for small content (${content.length} chars)`);
      return this.createLegacyParser(content, mergedOptions);
    }
  }
  
  /**
   * Create parser with explicit type selection
   */
  static createParserOfType(
    type: ParserType, 
    content: string, 
    options: ParserOptions = {}
  ): BloodTestParser | StreamingBloodTestParser {
    switch (type) {
      case 'legacy':
        return this.createLegacyParser(content, options);
      case 'streaming':
        return this.createStreamingParser(options);
      default:
        throw new Error(`Unknown parser type: ${type}`);
    }
  }
  
  /**
   * Get recommended parser type for given content
   */
  static getRecommendedParserType(content: string): ParserType {
    // Recommend streaming for large content or if running in memory-constrained environment
    if (content.length > 50000 || this.isMemoryConstrained()) {
      return 'streaming';
    }
    return 'legacy';
  }
  
  /**
   * Check if we're in a memory-constrained environment
   */
  private static isMemoryConstrained(): boolean {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    
    // Consider constrained if using >75% of heap or >200MB
    return (heapUsedMB / heapTotalMB > 0.75) || (heapUsedMB > 200);
  }
  
  /**
   * Create parser with memory monitoring
   */
  static createMonitoredParser(content: string, options: ParserOptions = {}) {
    const parserOptions = {
      ...options,
      enableMonitoring: true,
      enableLogging: true
    };
    
    return this.autoSelectParser(content, parserOptions);
  }
  
  /**
   * Create parser optimized for testing
   */
  static createTestParser(content: string, options: ParserOptions = {}) {
    const testOptions = {
      ...options,
      enableMonitoring: false, // Disable for faster tests
      enableLogging: false,    // Reduce noise in test output
      maxMemoryMB: 50         // Lower memory limit for tests
    };
    
    return this.autoSelectParser(content, testOptions);
  }
}

/**
 * Convenience wrapper for async parser operations
 */
export class AsyncParserWrapper {
  private parser: BloodTestParser | StreamingBloodTestParser;
  
  constructor(parser: BloodTestParser | StreamingBloodTestParser) {
    this.parser = parser;
  }
  
  async parse(content?: string): Promise<any> {
    if (this.parser instanceof StreamingBloodTestParser) {
      if (!content) {
        throw new Error('Content required for streaming parser');
      }
      const result = await this.parser.parse(content);
      return result.data; // Return just the data, not the metadata
    } else {
      // Legacy parser
      return await this.parser.parse();
    }
  }
  
  dispose(): void {
    this.parser.dispose();
  }
  
  isDisposed(): boolean {
    return this.parser.isDisposed();
  }
}

/**
 * Helper to migrate from legacy to streaming parser
 */
export class ParserMigrationHelper {
  /**
   * Compare results between legacy and streaming parsers
   */
  static async compareResults(content: string, options: ParserOptions = {}) {
    const legacyParser = ParserFactory.createLegacyParser(content, options);
    const streamingParser = ParserFactory.createStreamingParser(options);
    
    try {
      const [legacyResult, streamingResult] = await Promise.all([
        legacyParser.parse(),
        streamingParser.parse(content)
      ]);
      
      return {
        legacy: legacyResult,
        streaming: streamingResult.data,
        metadata: streamingResult.metadata,
        comparison: {
          biomarkerCountMatch: legacyResult.biomarkers.length === streamingResult.data.biomarkers.length,
          remarkCountMatch: legacyResult.remarks.length === streamingResult.data.remarks.length
        }
      };
    } finally {
      legacyParser.dispose();
      streamingParser.dispose();
    }
  }
  
  /**
   * Test migration safety for a given content
   */
  static async testMigrationSafety(content: string): Promise<boolean> {
    try {
      const comparison = await this.compareResults(content);
      return comparison.comparison.biomarkerCountMatch && comparison.comparison.remarkCountMatch;
    } catch (error) {
      console.error('Migration safety test failed:', error);
      return false;
    }
  }
}