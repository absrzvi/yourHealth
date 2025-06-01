Thank you for sharing this comprehensive documentation! After analyzing your OCR parsing system and the memory leak issues, I can see both the immediate problems and opportunities for a more robust architecture. Let me provide both immediate fixes and a redesigned solution.
Immediate Issues with Current Implementation

Fragile Cleanup Pattern: Using @ts-expect-error to access private properties is brittle
Global State Management: Monkey-patching constructors and global arrays create memory risks
Large String Processing: Processing entire OCR content in memory simultaneously
Complex State Tracking: Multiple layers of state that need manual cleanup

Immediate Fixes

Thank you for sharing this comprehensive documentation! After analyzing your OCR parsing system and the memory leak issues, I can see both the immediate problems and opportunities for a more robust architecture. Let me provide both immediate fixes and a redesigned solution.
Immediate Issues with Current Implementation

Fragile Cleanup Pattern: Using @ts-expect-error to access private properties is brittle
Global State Management: Monkey-patching constructors and global arrays create memory risks
Large String Processing: Processing entire OCR content in memory simultaneously
Complex State Tracking: Multiple layers of state that need manual cleanup

Immediate Fixes

// lib/parsers/streaming/StreamingBloodTestParser.ts

interface ParseResult<T> {
  data: T;
  error?: Error;
  metadata: {
    confidence: number;
    processingTime: number;
    memoryUsed: number;
  };
}

interface StreamingOptions {
  chunkSize?: number;
  maxMemoryMB?: number;
  enableLogging?: boolean;
  enableMonitoring?: boolean;
}

/**
 * Memory-efficient streaming parser that processes OCR text in chunks
 * without keeping entire content in memory
 */
export class StreamingBloodTestParser {
  private readonly options: Required<StreamingOptions>;
  private disposed = false;
  
  constructor(options: StreamingOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize ?? 10000, // 10KB chunks
      maxMemoryMB: options.maxMemoryMB ?? 100, // 100MB limit
      enableLogging: options.enableLogging ?? false,
      enableMonitoring: options.enableMonitoring ?? false
    };
  }

  async parse(content: string): Promise<ParseResult<BloodTestData>> {
    this.checkDisposed();
    
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();
    
    try {
      const result = await this.parseStreaming(content);
      
      const endTime = Date.now();
      const endMemory = this.getMemoryUsage();
      
      return {
        data: result,
        metadata: {
          confidence: this.calculateConfidence(result.biomarkers),
          processingTime: endTime - startTime,
          memoryUsed: endMemory - startMemory
        }
      };
    } catch (error) {
      return {
        data: { type: 'BLOOD_TEST', biomarkers: [], remarks: [], metadata: {} },
        error: error as Error,
        metadata: {
          confidence: 0,
          processingTime: Date.now() - startTime,
          memoryUsed: this.getMemoryUsage() - startMemory
        }
      };
    }
  }

  private async parseStreaming(content: string): Promise<BloodTestData> {
    // Use async generators for memory-efficient processing
    const biomarkers: ExtractedBiomarker[] = [];
    const remarks: Remark[] = [];
    
    // Process content in streaming fashion
    for await (const chunk of this.createChunks(content)) {
      const normalizedChunk = await this.normalizeChunk(chunk);
      
      // Extract biomarkers from chunk
      const chunkBiomarkers = await this.extractBiomarkersFromChunk(normalizedChunk);
      biomarkers.push(...chunkBiomarkers);
      
      // Extract remarks from chunk
      const chunkRemarks = await this.extractRemarksFromChunk(normalizedChunk);
      remarks.push(...chunkRemarks);
      
      // Memory check
      if (this.getMemoryUsage() > this.options.maxMemoryMB * 1024 * 1024) {
        throw new Error(`Memory usage exceeded ${this.options.maxMemoryMB}MB limit`);
      }
    }
    
    // Post-process to remove duplicates and validate
    const validatedBiomarkers = await this.validateBiomarkers(biomarkers);
    const dedupedRemarks = this.deduplicateRemarks(remarks);
    
    return {
      type: 'BLOOD_TEST',
      biomarkers: validatedBiomarkers,
      remarks: dedupedRemarks,
      metadata: {
        parser: 'StreamingBloodTestParser',
        biomarkerCount: validatedBiomarkers.length,
        remarkCount: dedupedRemarks.length,
        parsedAt: new Date().toISOString()
      }
    };
  }

  private async *createChunks(content: string): AsyncGenerator<string, void, unknown> {
    for (let i = 0; i < content.length; i += this.options.chunkSize) {
      const chunk = content.slice(i, i + this.options.chunkSize);
      yield chunk;
      
      // Allow other tasks to run
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  private async normalizeChunk(chunk: string): Promise<string> {
    // Apply normalization rules without keeping intermediate results
    return StreamingNormalizer.normalize(chunk);
  }

  private async extractBiomarkersFromChunk(chunk: string): Promise<ExtractedBiomarker[]> {
    const lines = chunk.split('\n');
    const biomarkers: ExtractedBiomarker[] = [];
    
    for (const line of lines) {
      const lineBiomarkers = StreamingBiomarkerExtractor.extractFromLine(line);
      biomarkers.push(...lineBiomarkers);
    }
    
    return biomarkers;
  }

  private async extractRemarksFromChunk(chunk: string): Promise<Remark[]> {
    return StreamingRemarksExtractor.extractFromChunk(chunk);
  }

  private async validateBiomarkers(biomarkers: ExtractedBiomarker[]): Promise<ExtractedBiomarker[]> {
    // Process in small batches to avoid memory spikes
    const BATCH_SIZE = 50;
    const validated: ExtractedBiomarker[] = [];
    
    for (let i = 0; i < biomarkers.length; i += BATCH_SIZE) {
      const batch = biomarkers.slice(i, i + BATCH_SIZE);
      const validatedBatch = await StreamingValidator.validateBatch(batch);
      validated.push(...validatedBatch);
      
      // Yield control
      await new Promise(resolve => setImmediate(resolve));
    }
    
    return this.removeDuplicates(validated);
  }

  private deduplicateRemarks(remarks: Remark[]): Remark[] {
    const seen = new Set<string>();
    return remarks.filter(remark => {
      const key = `${remark.text}:${remark.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private removeDuplicates(biomarkers: ExtractedBiomarker[]): ExtractedBiomarker[] {
    const seen = new Map<string, ExtractedBiomarker>();
    
    for (const biomarker of biomarkers) {
      const key = `${biomarker.name}:${biomarker.value}:${biomarker.unit}`;
      const existing = seen.get(key);
      
      if (!existing || biomarker.confidence > existing.confidence) {
        seen.set(key, biomarker);
      }
    }
    
    return Array.from(seen.values());
  }

  private calculateConfidence(biomarkers: ExtractedBiomarker[]): number {
    if (biomarkers.length === 0) return 0;
    const total = biomarkers.reduce((sum, b) => sum + (b.confidence || 0), 0);
    return total / biomarkers.length;
  }

  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('Parser has been disposed');
    }
  }

  dispose(): void {
    this.disposed = true;
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Static utility classes for streaming processing
 */
class StreamingNormalizer {
  static normalize(chunk: string): string {
    // Apply normalization rules efficiently
    let result = chunk;
    
    // Character substitutions
    result = this.fixCharacterSubstitutions(result);
    
    // Spacing normalization
    result = this.normalizeSpacing(result);
    
    // Word reassembly
    result = this.reassembleSpacedWords(result);
    
    return result;
  }

  private static fixCharacterSubstitutions(text: string): string {
    // Apply only essential substitutions to avoid memory expansion
    const substitutions: [RegExp, string][] = [
      [/\bG1ucose\b/gi, 'Glucose'],
      [/\bCho1estero1\b/gi, 'Cholesterol'],
      [/mg\/dl\b/gi, 'mg/dL'],
      [/meq\/l\b/gi, 'meq/L'],
      // Add more as needed
    ];
    
    let result = text;
    for (const [pattern, replacement] of substitutions) {
      result = result.replace(pattern, replacement);
    }
    
    return result;
  }

  private static normalizeSpacing(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s*:\s*/g, ': ')
      .trim();
  }

  private static reassembleSpacedWords(text: string): string {
    // Simple word reassembly
    return text.replace(/([A-Za-z])\s+([A-Za-z])/g, '$1$2');
  }
}

class StreamingBiomarkerExtractor {
  static extractFromLine(line: string): ExtractedBiomarker[] {
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Simple pattern matching for biomarkers
    const patterns = [
      /(\w+(?:\s+\w+)*)\s*:\s*([0-9.]+)\s*([a-zA-Z\/µ%]+)(?:\s*\(([^)]+)\))?/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        biomarkers.push({
          name: match[1].trim(),
          value: parseFloat(match[2]),
          unit: match[3],
          referenceRange: match[4] || '',
          confidence: 0.8
        });
      }
    }
    
    return biomarkers;
  }
}

class StreamingRemarksExtractor {
  static extractFromChunk(chunk: string): Remark[] {
    const remarks: Remark[] = [];
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      // Look for remark patterns
      if (this.isRemarkLine(line)) {
        remarks.push({
          id: this.generateId(),
          text: line.trim(),
          type: 'general',
          confidence: 0.7
        });
      }
    }
    
    return remarks;
  }

  private static isRemarkLine(line: string): boolean {
    const remarkIndicators = [
      /^\s*\*\s*/,
      /^\s*note\s*:/i,
      /^\s*comment\s*:/i,
      /^\s*remark\s*:/i
    ];
    
    return remarkIndicators.some(pattern => pattern.test(line));
  }

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

class StreamingValidator {
  static async validateBatch(biomarkers: ExtractedBiomarker[]): Promise<ExtractedBiomarker[]> {
    const validated: ExtractedBiomarker[] = [];
    
    for (const biomarker of biomarkers) {
      if (this.isValidBiomarker(biomarker)) {
        validated.push(biomarker);
      }
    }
    
    return validated;
  }

  private static isValidBiomarker(biomarker: ExtractedBiomarker): boolean {
    // Basic validation
    return (
      biomarker.name &&
      biomarker.name.length > 1 &&
      typeof biomarker.value === 'number' &&
      !isNaN(biomarker.value) &&
      biomarker.unit &&
      biomarker.unit.length > 0
    );
  }
}

// Usage example and test utility
export class ParserFactory {
  static createStreamingParser(options?: StreamingOptions): StreamingBloodTestParser {
    return new StreamingBloodTestParser(options);
  }
  
  static createLegacyParser(content: string, options?: any): BloodTestParser {
    return new BloodTestParser(content, options);
  }
}

// Test utilities
export class TestResourceManager {
  private parsers: (StreamingBloodTestParser | BloodTestParser)[] = [];
  
  createStreamingParser(options?: StreamingOptions): StreamingBloodTestParser {
    const parser = ParserFactory.createStreamingParser(options);
    this.parsers.push(parser);
    return parser;
  }
  
  createLegacyParser(content: string, options?: any): BloodTestParser {
    const parser = ParserFactory.createLegacyParser(content, options);
    this.parsers.push(parser);
    return parser;
  }
  
  cleanup(): void {
    this.parsers.forEach(parser => {
      if (!parser.isDisposed()) {
        parser.dispose();
      }
    });
    this.parsers = [];
    
    if (global.gc) {
      global.gc();
    }
  }
}

Redesigned Architecture Benefits
The new streaming architecture I've proposed addresses the core memory issues:

Streaming Processing: Processes OCR text in small chunks instead of loading everything into memory
Automatic Memory Monitoring: Built-in memory usage tracking with configurable limits
Proper Resource Management: Clean disposal pattern without fragile private property access
Async Processing: Uses async generators to yield control and prevent blocking
Configurable Options: Adjustable chunk sizes and memory limits for different environments

Immediate Recommendations
1. For Your Current System (Quick Fix):

Use the improved BloodTestParser with proper dispose() method
Replace global parser tracking with TestResourceManager
Add memory checks in your chunked processing

2. For Long-term (Recommended):

Migrate to the streaming architecture
This eliminates most memory issues by design
Much more scalable for large OCR inputs

3. Test Configuration:
bash# Add to your package.json scripts
"test:memory": "node --expose-gc --max-old-space-size=2048 ./node_modules/.bin/jest --runInBand --detectOpenHandles --forceExit",
"test:streaming": "jest --testPathPattern=streaming --runInBand"
4. Jest Configuration (jest.config.js):
javascriptmodule.exports = {
  // ... your existing config
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000, // Increase timeout for memory-intensive tests
  maxWorkers: 1, // Prevent parallel test interference
};
5. Jest Setup (jest.setup.js):
javascript// Global cleanup after each test
afterEach(() => {
  if (global.gc) {
    global.gc();
  }
});
Next Steps

Try the improved parser first - implement the TestResourceManager approach
Run your failing test with the new setup
If still having issues, migrate to the streaming architecture
Monitor memory usage during tests to verify the fix

MIGRATION GUIDE:

Step 1: Create the New File Structure

# Implementation Guide: Streaming Blood Test Parser

## 1. File Structure

Create these new files in your project:

```
lib/
├── parsers/
│   ├── streaming/                          # New streaming architecture
│   │   ├── StreamingBloodTestParser.ts    # Main streaming parser
│   │   ├── StreamingComponents.ts         # Streaming utilities
│   │   └── index.ts                       # Exports
│   ├── utils/                             # New utilities
│   │   ├── TestResourceManager.ts         # Test resource management
│   │   └── ParserFactory.ts              # Parser factory
│   ├── bloodTestParser.ts                 # Your existing parser (keep)
│   ├── ocrNormalizer.ts                   # Your existing normalizer (keep)
│   ├── biomarkerExtractor.ts             # Your existing extractor (keep)
│   └── remarksExtractor.ts               # Your existing extractor (keep)
└──
__tests__/
├── streaming/                             # New streaming tests
│   ├── StreamingBloodTestParser.test.ts
│   └── integration.test.ts
├── bloodTestParser.test.ts                # Update existing
└── simpleBloodTest.test.ts               # Update existing
```

## 2. Implementation Steps

### Step 1: Create the base streaming components
### Step 2: Integrate with existing extractors  
### Step 3: Update test files
### Step 4: Gradual migration strategy

## 3. Dependencies

Make sure you have these in your package.json:
- TypeScript (existing)
- Jest (existing) 
- Your existing dependencies

## 4. Migration Strategy

**Option A: Gradual (Recommended)**
- Keep existing parser working
- Add streaming parser alongside
- Migrate tests one by one
- Switch production usage when confident

**Option B: Full Replacement**
- Replace existing parser entirely
- Update all tests at once
- Higher risk but cleaner

## 5. Configuration Changes

Update these files:
- `jest.config.js` - test configuration
- `tsconfig.json` - if needed for new paths
- Any import statements in your app

### Step 2: Create the Core Streaming Files
Let's start with the essential files. Create these one by one:

Copy the code snipped below to new file: lib/parsers/streaming/StreamingBloodTestParser.ts

import { BiomarkerExtractor } from '../biomarkerExtractor';
import { RemarksExtractor } from '../remarksExtractor';
import { OcrNormalizer } from '../ocrNormalizer';

// Re-use your existing types
export interface ExtractedBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange?: string;
  confidence: number;
  status?: string;
  standardName?: string;
  category?: string;
}

export interface Remark {
  id: string;
  text: string;
  type: string;
  confidence: number;
  associatedBiomarkers?: string[];
}

export interface BloodTestData {
  type: string;
  biomarkers: ExtractedBiomarker[];
  remarks: Remark[];
  metadata: {
    parser: string;
    biomarkerCount: number;
    remarkCount: number;
    parsedAt: string;
    confidence?: number;
  };
}

interface ParseResult<T> {
  data: T;
  error?: Error;
  metadata: {
    confidence: number;
    processingTime: number;
    memoryUsed: number;
    chunksProcessed: number;
  };
}

interface StreamingOptions {
  chunkSize?: number;
  maxMemoryMB?: number;
  enableLogging?: boolean;
  enableMonitoring?: boolean;
}

export class StreamingBloodTestParser {
  private readonly options: Required<StreamingOptions>;
  private disposed = false;
  
  constructor(options: StreamingOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize ?? 10000, // 10KB chunks
      maxMemoryMB: options.maxMemoryMB ?? 100, // 100MB limit
      enableLogging: options.enableLogging ?? false,
      enableMonitoring: options.enableMonitoring ?? false
    };
  }

  async parse(content: string): Promise<ParseResult<BloodTestData>> {
    this.checkDisposed();
    
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();
    let chunksProcessed = 0;
    
    try {
      if (this.options.enableLogging) {
        console.log(`[StreamingParser] Starting parse of ${content.length} characters`);
      }

      const result = await this.parseStreaming(content, (chunks) => {
        chunksProcessed = chunks;
      });
      
      const endTime = Date.now();
      const endMemory = this.getMemoryUsage();
      
      if (this.options.enableLogging) {
        console.log(`[StreamingParser] Completed in ${endTime - startTime}ms, processed ${chunksProcessed} chunks`);
      }
      
      return {
        data: result,
        metadata: {
          confidence: this.calculateConfidence(result.biomarkers),
          processingTime: endTime - startTime,
          memoryUsed: endMemory - startMemory,
          chunksProcessed
        }
      };
    } catch (error) {
      if (this.options.enableLogging) {
        console.error('[StreamingParser] Parse failed:', error);
      }
      
      return {
        data: { 
          type: 'BLOOD_TEST', 
          biomarkers: [], 
          remarks: [], 
          metadata: {
            parser: 'StreamingBloodTestParser',
            biomarkerCount: 0,
            remarkCount: 0,
            parsedAt: new Date().toISOString()
          }
        },
        error: error as Error,
        metadata: {
          confidence: 0,
          processingTime: Date.now() - startTime,
          memoryUsed: this.getMemoryUsage() - startMemory,
          chunksProcessed
        }
      };
    }
  }

  private async parseStreaming(
    content: string, 
    onProgress: (chunks: number) => void
  ): Promise<BloodTestData> {
    const biomarkers: ExtractedBiomarker[] = [];
    const remarks: Remark[] = [];
    let chunksProcessed = 0;
    
    // Process content in chunks
    for await (const chunk of this.createChunks(content)) {
      // Normalize chunk using your existing OcrNormalizer
      const normalizedChunk = this.normalizeChunk(chunk);
      
      // Extract biomarkers using your existing BiomarkerExtractor
      const chunkBiomarkers = this.extractBiomarkersFromChunk(normalizedChunk);
      biomarkers.push(...chunkBiomarkers);
      
      // Extract remarks using your existing RemarksExtractor  
      const chunkRemarks = this.extractRemarksFromChunk(normalizedChunk);
      remarks.push(...chunkRemarks);
      
      chunksProcessed++;
      onProgress(chunksProcessed);
      
      // Memory check
      if (this.getMemoryUsage() > this.options.maxMemoryMB * 1024 * 1024) {
        throw new Error(`Memory usage exceeded ${this.options.maxMemoryMB}MB limit`);
      }
      
      // Yield control periodically
      if (chunksProcessed % 10 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Post-process using your existing validation logic
    const validatedBiomarkers = this.validateBiomarkers(biomarkers);
    const dedupedRemarks = this.deduplicateRemarks(remarks);
    
    return {
      type: 'BLOOD_TEST',
      biomarkers: validatedBiomarkers,
      remarks: dedupedRemarks,
      metadata: {
        parser: 'StreamingBloodTestParser',
        biomarkerCount: validatedBiomarkers.length,
        remarkCount: dedupedRemarks.length,
        parsedAt: new Date().toISOString(),
        confidence: this.calculateConfidence(validatedBiomarkers)
      }
    };
  }

  private async *createChunks(content: string): AsyncGenerator<string, void, unknown> {
    for (let i = 0; i < content.length; i += this.options.chunkSize) {
      // Try to break at word boundaries when possible
      let endIndex = i + this.options.chunkSize;
      if (endIndex < content.length) {
        const nextNewline = content.indexOf('\n', endIndex);
        if (nextNewline !== -1 && nextNewline - endIndex < 1000) {
          endIndex = nextNewline + 1;
        }
      }
      
      const chunk = content.slice(i, endIndex);
      yield chunk;
      
      // Allow other tasks to run
      await new Promise(resolve => setImmediate(resolve));
    }
  }

  private normalizeChunk(chunk: string): string {
    // Use your existing OcrNormalizer methods
    let result = chunk;
    
    // Apply your existing normalization methods
    result = OcrNormalizer.fixCharacterSubstitutions(result);
    result = OcrNormalizer.normalizeSpacing(result);
    result = OcrNormalizer.reassembleSpacedWords(result);
    result = OcrNormalizer.removeHeadersAndFooters(result);
    result = OcrNormalizer.normalizeLineBreaks(result);
    result = OcrNormalizer.trimLines(result);
    
    return result;
  }

  private extractBiomarkersFromChunk(chunk: string): ExtractedBiomarker[] {
    try {
      // Use your existing BiomarkerExtractor but on smaller chunks
      // We need to extract from individual lines to avoid processing the whole chunk at once
      const lines = chunk.split('\n');
      const biomarkers: ExtractedBiomarker[] = [];
      
      for (const line of lines) {
        if (line.trim().length === 0) continue;
        
        // Try to extract biomarkers from individual lines
        // This avoids the memory issues from processing large blocks
        const lineBiomarkers = this.extractFromSingleLine(line);
        biomarkers.push(...lineBiomarkers);
      }
      
      return biomarkers;
    } catch (error) {
      if (this.options.enableLogging) {
        console.warn('[StreamingParser] Biomarker extraction failed for chunk:', error);
      }
      return [];
    }
  }

  private extractFromSingleLine(line: string): ExtractedBiomarker[] {
    // Simple pattern matching for biomarkers (you can enhance this)
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Pattern: "Name: Value Unit" or "Name Value Unit"
    const patterns = [
      /(\w+(?:\s+\w+)*)\s*:\s*([0-9.]+)\s*([a-zA-Z\/µ%°]+)(?:\s*\(([^)]+)\))?/g,
      /(\w+(?:\s+\w+)*)\s+([0-9.]+)\s+([a-zA-Z\/µ%°]+)(?:\s+\(([^)]+)\))?/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const biomarker: ExtractedBiomarker = {
          name: match[1].trim(),
          value: parseFloat(match[2]),
          unit: match[3],
          referenceRange: match[4] || '',
          confidence: 0.8
        };
        
        // Basic validation
        if (biomarker.name.length > 1 && !isNaN(biomarker.value)) {
          biomarkers.push(biomarker);
        }
      }
    }
    
    return biomarkers;
  }

  private extractRemarksFromChunk(chunk: string): Remark[] {
    try {
      // Simple remark extraction for now
      const remarks: Remark[] = [];
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (this.isRemarkLine(line)) {
          remarks.push({
            id: this.generateId(),
            text: line.trim(),
            type: 'general',
            confidence: 0.7
          });
        }
      }
      
      return remarks;
    } catch (error) {
      if (this.options.enableLogging) {
        console.warn('[StreamingParser] Remark extraction failed for chunk:', error);
      }
      return [];
    }
  }

  private isRemarkLine(line: string): boolean {
    const remarkIndicators = [
      /^\s*\*\s*/,
      /^\s*note\s*:/i,
      /^\s*comment\s*:/i,
      /^\s*remark\s*:/i,
      /^\s*interpretation\s*:/i
    ];
    
    return remarkIndicators.some(pattern => pattern.test(line)) && line.trim().length > 10;
  }

  private validateBiomarkers(biomarkers: ExtractedBiomarker[]): ExtractedBiomarker[] {
    // Remove duplicates and invalid entries
    const seen = new Map<string, ExtractedBiomarker>();
    
    for (const biomarker of biomarkers) {
      const key = `${biomarker.name.toLowerCase()}:${biomarker.value}:${biomarker.unit}`;
      const existing = seen.get(key);
      
      // Keep the one with higher confidence
      if (!existing || biomarker.confidence > existing.confidence) {
        seen.set(key, biomarker);
      }
    }
    
    return Array.from(seen.values());
  }

  private deduplicateRemarks(remarks: Remark[]): Remark[] {
    const seen = new Set<string>();
    return remarks.filter(remark => {
      const key = remark.text.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateConfidence(biomarkers: ExtractedBiomarker[]): number {
    if (biomarkers.length === 0) return 0;
    const total = biomarkers.reduce((sum, b) => sum + (b.confidence || 0), 0);
    return total / biomarkers.length;
  }

  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private checkDisposed(): void {
    if (this.disposed) {
      throw new Error('Streaming parser has been disposed');
    }
  }

  dispose(): void {
    this.disposed = true;
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}

### Step 3: Create Supporting Utility Files

create the following new file and upload the code snippet below:
// lib/parsers/utils/TestResourceManager.ts

import { BloodTestParser } from '../bloodTestParser';
import { StreamingBloodTestParser } from '../streaming/StreamingBloodTestParser';

type AnyParser = BloodTestParser | StreamingBloodTestParser;

/**
 * Centralized resource manager for tests to prevent memory leaks
 */
export class TestResourceManager {
  private parsers: AnyParser[] = [];
  private testData: string[] = [];
  private disposed = false;
  
  /**
   * Create a legacy BloodTestParser and register it for cleanup
   */
  createLegacyParser(content: string, options: any = {}): BloodTestParser {
    this.checkDisposed();
    const parser = new BloodTestParser(content, options);
    this.parsers.push(parser);
    return parser;
  }
  
  /**
   * Create a StreamingBloodTestParser and register it for cleanup
   */
  createStreamingParser(options: any = {}): StreamingBloodTestParser {
    this.checkDisposed();
    const parser = new StreamingBloodTestParser(options);
    this.parsers.push(parser);
    return parser;
  }
  
  /**
   * Register test data for cleanup
   */
  registerTestData(data: string): string {
    this.checkDisposed();
    this.testData.push(data);
    return data;
  }
  
  /**
   * Create large test data for memory testing
   */
  createLargeTestData(basePattern: string, repeatCount: number): string {
    const largeData = basePattern.repeat(repeatCount);
    return this.registerTestData(largeData);
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
        console.warn('Failed to force garbage collection:', e);
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
    
    // Dispose all parsers
    this.parsers.forEach(parser => {
      try {
        if (!parser.isDisposed()) {
          parser.dispose();
        }
      } catch (error) {
        console.warn('Error disposing parser:', error);
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

/**
 * Memory monitoring utilities for tests
 */
export class MemoryMonitor {
  private snapshots: Array<{ name: string; memory: any; timestamp: number }> = [];
  
  takeSnapshot(name: string): void {
    this.snapshots.push({
      name,
      memory: process.memoryUsage(),
      timestamp: Date.now()
    });
  }
  
  getMemoryDelta(fromSnapshot: string, toSnapshot: string): number | null {
    const from = this.snapshots.find(s => s.name === fromSnapshot);
    const to = this.snapshots.find(s => s.name === toSnapshot);
    
    if (!from || !to) return null;
    
    return to.memory.heapUsed - from.memory.heapUsed;
  }
  
  logSnapshots(): void {
    console.log('\nMemory Snapshots:');
    this.snapshots.forEach((snapshot, index) => {
      const memMB = Math.round(snapshot.memory.heapUsed / 1024 / 1024);
      const delta = index > 0 
        ? Math.round((snapshot.memory.heapUsed - this.snapshots[index - 1].memory.heapUsed) / 1024 / 1024)
        : 0;
      
      console.log(`  ${snapshot.name}: ${memMB}MB (${delta >= 0 ? '+' : ''}${delta}MB)`);
    });
  }
  
  clear(): void {
    this.snapshots = [];
  }
}

####Create new file mentioned below and add the code snippet to the file:
// lib/parsers/utils/ParserFactory.ts

import { BloodTestParser } from '../bloodTestParser';
import { StreamingBloodTestParser } from '../streaming/StreamingBloodTestParser';

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
   * Create a StreamingBloodTestParser
   */
  static createStreamingParser(options: ParserOptions = {}): StreamingBloodTestParser {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return new StreamingBloodTestParser(mergedOptions);
  }
  
  /**
   * Auto-select parser based on content size
   */
  static createParser(content: string, options: ParserOptions = {}): BloodTestParser | StreamingBloodTestParser {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Use streaming parser for large content (>50KB)
    if (content.length > 50000) {
      console.log(`[ParserFactory] Using streaming parser for large content (${content.length} chars)`);
      const streamingParser = new StreamingBloodTestParser(mergedOptions);
      return streamingParser as any; // Type compatibility hack for now
    } else {
      console.log(`[ParserFactory] Using legacy parser for small content (${content.length} chars)`);
      return new BloodTestParser(content, mergedOptions);
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
    
    return this.createParser(content, parserOptions);
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
    
    return this.createParser(content, testOptions);
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

Step 4: Updated Test Examples
// __tests__/streaming/StreamingBloodTestParser.test.ts

import { StreamingBloodTestParser } from '@/lib/parsers/streaming/StreamingBloodTestParser';
import { TestResourceManager, MemoryMonitor } from '@/lib/parsers/utils/TestResourceManager';
import { ParserFactory } from '@/lib/parsers/utils/ParserFactory';

describe('StreamingBloodTestParser', () => {
  let resourceManager: TestResourceManager;
  let memoryMonitor: MemoryMonitor;
  
  beforeEach(() => {
    resourceManager = new TestResourceManager();
    memoryMonitor = new MemoryMonitor();
    memoryMonitor.takeSnapshot('test-start');
  });
  
  afterEach(() => {
    memoryMonitor.takeSnapshot('test-end');
    resourceManager.dispose();
  });

  describe('Memory Management', () => {
    it('should handle large inputs without memory leaks', async () => {
      // Create large test data
      const largeInput = resourceManager.createLargeTestData(
        'Glucose: 95 mg/dL (70-100)\nCholesterol: 180 mg/dL (150-200)\n',
        5000 // 5000 repetitions
      );
      
      memoryMonitor.takeSnapshot('before-parse');
      
      const parser = resourceManager.createStreamingParser({
        enableLogging: false,
        maxMemoryMB: 150 // Generous limit for test
      });
      
      const result = await parser.parse(largeInput);
      
      memoryMonitor.takeSnapshot('after-parse');
      
      expect(result.data.biomarkers.length).toBeGreaterThan(0);
      expect(result.metadata.chunksProcessed).toBeGreaterThan(1);
      
      // Memory should not have grown excessively
      const memoryDelta = memoryMonitor.getMemoryDelta('before-parse', 'after-parse');
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    });
    
    it('should respect memory limits', async () => {
      const largeInput = resourceManager.createLargeTestData('test data\n', 10000);
      
      const parser = resourceManager.createStreamingParser({
        maxMemoryMB: 1 // Very low limit to trigger error
      });
      
      const result = await parser.parse(largeInput);
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Memory usage exceeded');
    });
    
    it('should dispose properly', () => {
      const parser = resourceManager.createStreamingParser();
      
      expect(parser.isDisposed()).toBe(false);
      parser.dispose();
      expect(parser.isDisposed()).toBe(true);
      
      // Should throw when trying to parse disposed parser
      expect(() => parser.parse('test')).rejects.toThrow('disposed');
    });
  });

  describe('Parsing Functionality', () => {
    it('should parse simple blood test correctly', async () => {
      const testData = `
        Patient: John Doe
        Date: 2024-01-15
        
        Glucose: 95 mg/dL (70-100)
        Cholesterol: 180 mg/dL (150-200)
        HDL: 45 mg/dL (>40)
        
        * High glucose noted
      `;
      
      const parser = resourceManager.createStreamingParser({ enableLogging: false });
      const result = await parser.parse(testData);
      
      expect(result.error).toBeUndefined();
      expect(result.data.biomarkers).toHaveLength(3);
      expect(result.data.remarks.length).toBeGreaterThan(0);
      
      const glucose = result.data.biomarkers.find(b => b.name === 'Glucose');
      expect(glucose).toBeDefined();
      expect(glucose?.value).toBe(95);
      expect(glucose?.unit).toBe('mg/dL');
    });
    
    it('should handle OCR errors gracefully', async () => {
      const testData = `
        G1ucose: 9s mg/dl
        Cho1estero1: 1B0 mg/at
        HbAlc: 6.s %
      `;
      
      const parser = resourceManager.createStreamingParser({ enableLogging: false });
      const result = await parser.parse(testData);
      
      expect(result.error).toBeUndefined();
      // Should extract some biomarkers despite OCR errors
      expect(result.data.biomarkers.length).toBeGreaterThan(0);
    });
    
    it('should process in chunks', async () => {
      const parser = resourceManager.createStreamingParser({ 
        chunkSize: 100, // Small chunks to force chunking
        enableLogging: false 
      });
      
      const testData = 'Glucose: 95 mg/dL\n'.repeat(50); // Force multiple chunks
      const result = await parser.parse(testData);
      
      expect(result.metadata.chunksProcessed).toBeGreaterThan(1);
      expect(result.data.biomarkers.length).toBeGreaterThan(0);
    });
  });
});

// __tests__/simpleBloodTest.test.ts (Updated)

import { TestResourceManager } from '@/lib/parsers/utils/TestResourceManager';
import { ParserFactory } from '@/lib/parsers/utils/ParserFactory';

describe('Simple Blood Test - Updated', () => {
  let resourceManager: TestResourceManager;
  
  beforeEach(() => {
    resourceManager = new TestResourceManager();
  });
  
  afterEach(() => {
    resourceManager.dispose();
  });

  it('should parse minimal blood test data with legacy parser', async () => {
    const parser = resourceManager.createLegacyParser('Glucose: 95 mg/dL', { 
      enableMonitoring: false,
      enableLogging: false 
    });
    
    const result = await parser.parse();
    
    expect(result).toBeDefined();
    expect(result.biomarkers).toHaveLength(1);
    expect(result.biomarkers[0].name).toContain('Glucose');
  });
  
  it('should parse minimal blood test data with streaming parser', async () => {
    const parser = resourceManager.createStreamingParser({ 
      enableMonitoring: false,
      enableLogging: false 
    });
    
    const result = await parser.parse('Glucose: 95 mg/dL');
    
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data.biomarkers).toHaveLength(1);
    expect(result.data.biomarkers[0].name).toBe('Glucose');
    expect(result.data.biomarkers[0].value).toBe(95);
    expect(result.data.biomarkers[0].unit).toBe('mg/dL');
  });
  
  it('should auto-select appropriate parser', async () => {
    // Small content should use legacy parser
    const smallParser = ParserFactory.createTestParser('Glucose: 95 mg/dL');
    expect(smallParser.constructor.name).toBe('BloodTestParser');
    
    // Large content should use streaming parser  
    const largeContent = 'Glucose: 95 mg/dL\n'.repeat(5000);
    const largeParser = ParserFactory.createTestParser(largeContent);
    expect(largeParser.constructor.name).toBe('StreamingBloodTestParser');
    
    // Clean up
    smallParser.dispose();
    largeParser.dispose();
  });
});

// __tests__/bloodTestParser.test.ts (Updated with migration)

import { BloodTestParser } from '@/lib/parsers/bloodTestParser';
import { TestResourceManager, MemoryMonitor } from '@/lib/parsers/utils/TestResourceManager';
import { ParserMigrationHelper } from '@/lib/parsers/utils/ParserFactory';

describe('BloodTestParser - Legacy with Migration', () => {
  let resourceManager: TestResourceManager;
  let memoryMonitor: MemoryMonitor;
  
  beforeEach(() => {
    resourceManager = new TestResourceManager();
    memoryMonitor = new MemoryMonitor();
  });
  
  afterEach(() => {
    memoryMonitor.logSnapshots(); // Log memory usage for debugging
    resourceManager.dispose();
  });

  describe('Legacy Parser Tests', () => {
    it('should parse complex blood test data', async () => {
      const testData = resourceManager.registerTestData(`
        COMPREHENSIVE METABOLIC PANEL
        Patient: John Doe
        DOB: 1980-01-01
        Date: 2024-01-15
        
        GLUCOSE: 95 mg/dL (70-100)
        BUN: 15 mg/dL (7-20)
        CREATININE: 1.0 mg/dL (0.7-1.3)
        BUN/CREATININE RATIO: 15 (10-20)
        SODIUM: 140 mmol/L (136-145)
        POTASSIUM: 4.0 mmol/L (3.5-5.1)
        CHLORIDE: 102 mmol/L (98-107)
        CO2: 24 mmol/L (22-28)
        
        * All values within normal limits
        * Patient fasting for 12 hours
      `);
      
      memoryMonitor.takeSnapshot('before-legacy-parse');
      
      const parser = resourceManager.createLegacyParser(testData, { enableMonitoring: false });
      const result = await parser.parse();
      
      memoryMonitor.takeSnapshot('after-legacy-parse');
      
      expect(result.biomarkers.length).toBeGreaterThan(5);
      expect(result.remarks.length).toBeGreaterThan(0);
      
      // Find specific biomarkers
      const glucose = result.biomarkers.find(b => b.name.toLowerCase().includes('glucose'));
      expect(glucose).toBeDefined();
      expect(glucose?.value).toBe(95);
    });
  });

  describe('Migration Testing', () => {
    it('should produce similar results with both parsers', async () => {
      const testData = `
        Glucose: 95 mg/dL (70-100)
        Cholesterol: 180 mg/dL (150-200)
        HDL: 45 mg/dL (>40)
        LDL: 120 mg/dL (<100)
      `;
      
      const comparison = await ParserMigrationHelper.compareResults(testData, {
        enableMonitoring: false,
        enableLogging: false
      });
      
      expect(comparison.legacy).toBeDefined();
      expect(comparison.streaming).toBeDefined();
      
      // Should have similar biomarker counts
      expect(Math.abs(
        comparison.legacy.biomarkers.length - comparison.streaming.biomarkers.length
      )).toBeLessThanOrEqual(1); // Allow for minor differences
      
      console.log('Migration comparison:', {
        legacy: comparison.legacy.biomarkers.length,
        streaming: comparison.streaming.biomarkers.length,
        processingTime: comparison.metadata.processingTime
      });
    });
    
    it('should validate migration safety', async () => {
      const testData = 'Glucose: 95 mg/dL\nCholesterol: 180 mg/dL';
      
      const isSafe = await ParserMigrationHelper.testMigrationSafety(testData);
      expect(isSafe).toBe(true);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not leak memory with multiple parser instances', async () => {
      memoryMonitor.takeSnapshot('start-multiple-parsers');
      
      // Create and use multiple parsers
      for (let i = 0; i < 10; i++) {
        const parser = resourceManager.createLegacyParser(`Test ${i}: ${i * 10} mg/dL`, {
          enableMonitoring: false
        });
        
        await parser.parse();
        // Parser will be disposed by resourceManager
      }
      
      memoryMonitor.takeSnapshot('end-multiple-parsers');
      
      // Force cleanup
      resourceManager.forceGC();
      
      memoryMonitor.takeSnapshot('after-gc');
      
      // Memory should not grow excessively
      const memoryGrowth = memoryMonitor.getMemoryDelta('start-multiple-parsers', 'after-gc');
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
  });
});

Step 5: Implementation Instructions
Here are the exact steps to implement this in your environment:
# Implementation Steps

## 1. Create Directory Structure

```bash
# Navigate to your project root
cd your-project-directory

# Create new directories
mkdir -p lib/parsers/streaming
mkdir -p lib/parsers/utils
mkdir -p __tests__/streaming
```

## 2. Create the Files

Copy the code from the artifacts above into these files:

### Core Streaming Parser
```bash
# Create the main streaming parser
touch lib/parsers/streaming/StreamingBloodTestParser.ts
# Copy content from "StreamingBloodTestParser.ts" artifact
```

### Utility Files
```bash
# Create utility files
touch lib/parsers/utils/TestResourceManager.ts
touch lib/parsers/utils/ParserFactory.ts

# Copy content from respective artifacts
```

### Test Files
```bash
# Create test files
touch __tests__/streaming/StreamingBloodTestParser.test.ts
# Update your existing test files with the new patterns
```

## 3. Update Your Existing Files

### Update package.json scripts:
```json
{
  "scripts": {
    "test": "jest --runInBand --detectOpenHandles --forceExit",
    "test:memory": "node --expose-gc --max-old-space-size=2048 ./node_modules/.bin/jest --runInBand",
    "test:streaming": "jest --testPathPattern=streaming",
    "test:simple": "jest simpleBloodTest.test.ts"
  }
}
```

### Update jest.config.js:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__', '<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  // Add module path mapping if needed
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
```

### Create jest.setup.js:
```javascript
// jest.setup.js
afterEach(() => {
  if (global.gc) {
    global.gc();
  }
});

// Increase timeout for memory-intensive tests
jest.setTimeout(30000);
```

## 4. Quick Test - Run Simple Test

```bash
# Test the new streaming parser with a simple test
npm run test:simple
```

If this passes, your implementation is working!

## 5. Gradual Migration Strategy

### Phase 1: Side-by-side (Current Phase)
- Keep your existing `bloodTestParser.ts`
- Add new streaming parser alongside
- Use `TestResourceManager` in tests
- Compare results with `ParserMigrationHelper`

### Phase 2: Selective Migration
```typescript
// In your application code, start using the factory
import { ParserFactory } from '@/lib/parsers/utils/ParserFactory';

// Auto-select based on content size
const parser = ParserFactory.createTestParser(ocrContent);
const result = await parser.parse(ocrContent);
parser.dispose();
```

### Phase 3: Full Migration
- Replace all usage with streaming parser
- Remove old parser when confident

## 6. Test Your Implementation

Run these commands to verify everything works:

```bash
# Test just the streaming parser
npm run test:streaming

# Test memory usage
npm run test:memory

# Test the problematic simple test that was failing
npm test -- --testNamePattern="Simple" --no-runInBand

# Run all tests
npm test
```

## 7. Monitor Memory Usage

Add this to see memory usage in your tests:

```typescript
// In any test file
import { MemoryMonitor } from '@/lib/parsers/utils/TestResourceManager';

const monitor = new MemoryMonitor();
monitor.takeSnapshot('start');
// ... your test code ...
monitor.takeSnapshot('end');
monitor.logSnapshots(); // See memory usage
```

## 8. Configuration Options

You can configure the parsers for your specific needs:

```typescript
// For production - optimize for memory
const parser = ParserFactory.createStreamingParser({
  chunkSize: 5000,        // Smaller chunks for less memory
  maxMemoryMB: 50,        // Strict memory limit
  enableLogging: false,   // No logging overhead
  enableMonitoring: false // No monitoring overhead
});

// For development - optimize for debugging
const parser = ParserFactory.createStreamingParser({
  chunkSize: 20000,       // Larger chunks for speed
  maxMemoryMB: 200,       // Generous memory limit
  enableLogging: true,    // Enable logging
  enableMonitoring: true  // Enable performance monitoring
});

// For testing - optimize for reliability
const parser = ParserFactory.createTestParser(content);
```

## 9. Error Handling

The new system provides better error handling:

```typescript
const result = await parser.parse(content);

if (result.error) {
  console.error('Parsing failed:', result.error.message);
  console.log('Metadata:', result.metadata);
} else {
  console.log('Success:', result.data.biomarkers.length, 'biomarkers found');
  console.log('Performance:', result.metadata.processingTime, 'ms');
}
```

## 10. Troubleshooting

If you encounter issues:

1. **Import errors**: Check your tsconfig.json paths
2. **Test failures**: Make sure you're using `TestResourceManager`
3. **Memory still leaking**: Enable logging to see what's happening
4. **Performance issues**: Adjust `chunkSize` for your data

## Next Steps

1. Create the files as shown above
2. Run the simple test to verify it works
3. Gradually migrate your existing tests
4. Monitor memory usage and adjust configuration as needed

Let me know if you need help with any specific step!

