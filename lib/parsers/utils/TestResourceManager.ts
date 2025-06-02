// lib/parsers/utils/TestResourceManager.ts - FIXED VERSION

import { BloodTestParser } from '../bloodTestParser';
// import { StreamingBloodTestParser } from '../streaming/StreamingBloodTestParser'; // Uncomment when implemented

type AnyParser = BloodTestParser; // | StreamingBloodTestParser;

export class TestResourceManager {
  private parsers: AnyParser[] = [];
  private testData: string[] = [];
  private disposed = false;
  
  /**
   * Create a legacy BloodTestParser with proper content validation
   */
  createLegacyParser(content: any, options: any = {}): BloodTestParser {
    this.checkDisposed();
    
    // Ensure content is always a string
    const contentString = typeof content === 'string' ? content : String(content || '');
    // Debug logging disabled
    
    // Pass null as the first parameter (file) and contentString as the second parameter (content)
    const parser = new BloodTestParser(null, contentString, {
      enableMonitoring: false, // Default to false for tests
      enableLogging: false,    // Default to false for tests
      ...options
    });
    
    this.parsers.push(parser);
    return parser;
  }
  
  /**
   * Create a StreamingBloodTestParser (when implemented)
   */
  createStreamingParser(options: any = {}): any {
    this.checkDisposed();
    
    // For now, return a mock until StreamingBloodTestParser is fully implemented
    const mockStreamingParser = {
      async parse(content: any) {
        const contentString = this.ensureString(content);
        console.log(`[MockStreamingParser] Would parse ${contentString.length} chars`);
        
        return {
          data: {
            type: 'BLOOD_TEST',
            biomarkers: [],
            remarks: [],
            metadata: {
              parser: 'MockStreamingParser',
              biomarkerCount: 0,
              remarkCount: 0,
              parsedAt: new Date().toISOString()
            }
          },
          metadata: {
            confidence: 0,
            processingTime: 10,
            memoryUsed: 1024,
            chunksProcessed: 1
          }
        };
      },
      dispose() {
        console.log('[MockStreamingParser] Disposed');
      },
      isDisposed() {
        return false;
      }
    };
    
    // @ts-ignore - Mock for now
    this.parsers.push(mockStreamingParser);
    return mockStreamingParser;
  }
  
  /**
   * Register test data for cleanup and ensure it's a string
   */
  registerTestData(data: any): string {
    this.checkDisposed();
    
    // Convert to string if needed
    const dataString = typeof data === 'string' ? data : String(data || '');
    
    // Debug logging disabled
    this.testData.push(dataString);
    
    return dataString;
  }
  
  /**
   * Create large test data for memory testing
   */
  createLargeTestData(basePattern: string, repeatCount: number): string {
    const baseString = this.ensureString(basePattern);
    const largeData = baseString.repeat(repeatCount);
    return this.registerTestData(largeData);
  }
  
  /**
   * Ensure input is converted to string properly
   */
  private ensureString(input: any): string {
    if (typeof input === 'string') {
      return input;
    }
    
    if (input === null || input === undefined) {
      return '';
    }
    
    if (typeof input === 'object') {
      // If it's an object, try to stringify it or extract meaningful content
      if (input.toString && typeof input.toString === 'function') {
        const result = input.toString();
        if (result !== '[object Object]') {
          return result;
        }
      }
      
      // Try JSON.stringify as last resort
      try {
        return JSON.stringify(input);
      } catch (e) {
        console.warn('[TestResourceManager] Failed to stringify object, using empty string');
        return '';
      }
    }
    
    return String(input);
  }
  
  /**
   * Get count of active (non-disposed) parsers
   */
  getActiveParserCount(): number {
    return this.parsers.filter(p => !p.isDisposed()).length;
  }
  
  /**
   * Get memory usage information
   */
  getMemoryInfo(): { heapUsed: number; heapTotal: number; external: number } {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    };
  }
  
  /**
   * Force garbage collection if available
   */
  forceGC(): boolean {
    if (global.gc) {
      try {
        global.gc();
        return true;
      } catch (e) {
        // Debug logging disabled
        return false;
      }
    }
    return false;
  }
  
  /**
   * Clean up all registered resources
   */
  cleanup(): void {
    if (this.disposed) return;
    
    // Debug logging disabled
    
    // Dispose all parsers
    this.parsers.forEach((parser, index) => {
      try {
        if (parser && typeof parser.dispose === 'function' && !parser.isDisposed()) {
          parser.dispose();
        }
      } catch (error) {
        // Debug logging disabled
      }
    });
    this.parsers = [];
    
    // Clear test data references
    this.testData = [];
    
    // Force garbage collection if available
    this.forceGC();
  }
  
  /**
   * Dispose the resource manager itself
   */
  dispose(): void {
    this.cleanup();
    this.disposed = true;
  }
  
  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('TestResourceManager has been disposed');
    }
  }
}

/**
 * Helper function to create and auto-cleanup resource manager in tests
 */
export function withResourceManager<T>(
  testFn: (manager: TestResourceManager) => T | Promise<T>
): () => Promise<T> {
  return async () => {
    const manager = new TestResourceManager();
    try {
      return await testFn(manager);
    } finally {
      manager.dispose();
    }
  };
}