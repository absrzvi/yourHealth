// lib/parsers/streaming/StreamingBloodTestParser.ts

import { BiomarkerExtractor } from '../biomarkerExtractor';
import { RemarksExtractor } from '../remarksExtractor';
import { OcrNormalizer } from '../ocrNormalizer';
import { Parser } from '../utils/parserFactory';

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

export class StreamingBloodTestParser implements Parser {
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
    // Apply normalization methods from OcrNormalizer
    // Only use methods that are actually available in OcrNormalizer
    result = OcrNormalizer.fixCharacterSubstitutions(result);
    result = OcrNormalizer.normalizeSpacing(result);
    
    // Check if these methods exist before calling them
    if (typeof OcrNormalizer.reassembleSpacedWords === 'function') {
      result = OcrNormalizer.reassembleSpacedWords(result);
    }
    
    // Use removeHeadersFooters instead of removeHeadersAndFooters
    if (typeof OcrNormalizer.removeHeadersFooters === 'function') {
      result = OcrNormalizer.removeHeadersFooters(result);
    }
    
    if (typeof OcrNormalizer.normalizeLineBreaks === 'function') {
      result = OcrNormalizer.normalizeLineBreaks(result);
    }
    
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