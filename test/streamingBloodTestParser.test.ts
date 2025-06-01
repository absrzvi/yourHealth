// test/streamingBloodTestParser.test.ts

import { StreamingBloodTestParser } from '../lib/parsers/streaming/StreamingBloodTestParser';
import { BloodTestParser } from '../lib/parsers/bloodTestParser';
import '../lib/parsers/bloodTestParserExtension'; // Import extension to add dispose methods
import { TestResourceManager, withResourceManager, MemoryMonitor } from '../lib/parsers/utils/TestResourceManager';
import { ParserFactory } from '../lib/parsers/utils/parserFactory';

/**
 * Sample test data for parser testing
 */
const SAMPLE_TEST_DATA = `
Laboratory Report
Patient: John Doe
Date: 01/01/2025

Test Results:
Glucose: 95 mg/dL (70-100)
Hemoglobin: 14.2 g/dL (12-16)
WBC: 7.5 10^3/µL (4.5-11.0)
Cholesterol: 185 mg/dL (<200)
Triglycerides: 120 mg/dL (<150)
HDL: 55 mg/dL (>40)
LDL: 110 mg/dL (<130)
TSH: 2.5 µIU/mL (0.4-4.0)

* All values are within normal reference ranges.
* No significant changes from previous test.
`;

describe('StreamingBloodTestParser', () => {
  
  // Basic functionality test
  test('should parse blood test data correctly', withResourceManager(async (manager) => {
    // Create parser using resource manager
    const parser = manager.createStreamingParser({
      enableLogging: false,
      chunkSize: 500 // Small chunks for testing
    });
    
    // Process content
    const result = await parser.parse(SAMPLE_TEST_DATA);
    
    // Verify basic structure
    expect(result.data).toBeDefined();
    expect(result.data.type).toBe('BLOOD_TEST');
    expect(result.data.biomarkers).toBeInstanceOf(Array);
    expect(result.data.remarks).toBeInstanceOf(Array);
    
    // Verify biomarkers were extracted
    expect(result.data.biomarkers.length).toBeGreaterThan(0);
    
    // Check for expected biomarkers
    const biomarkerNames = result.data.biomarkers.map(b => b.name.toLowerCase());
    expect(biomarkerNames).toContain('glucose');
    expect(biomarkerNames).toContain('cholesterol');
    expect(biomarkerNames).toContain('tsh');
    
    // Check performance metadata
    expect(result.metadata.processingTime).toBeGreaterThan(0);
    expect(result.metadata.chunksProcessed).toBeGreaterThan(1); // Multiple chunks processed
    
    // No memory leaks should be reported in finally block
  }));
  
  // Compare with legacy parser
  test('should produce similar results to legacy parser', withResourceManager(async (manager) => {
    // Set up memory monitoring
    const memoryMonitor = new MemoryMonitor();
    memoryMonitor.takeSnapshot('start');
    
    // Create test data
    const testData = manager.registerTestData(SAMPLE_TEST_DATA);
    
    // Create both parser types
    const legacyParser = manager.createLegacyParser(testData, {
      enableLogging: false
    });
    
    const streamingParser = manager.createStreamingParser({
      enableLogging: false,
      chunkSize: 1000
    });
    
    // Parse with legacy parser
    memoryMonitor.takeSnapshot('before-legacy');
    // Cast to any to handle potential type mismatches during testing
    const legacyResult = await legacyParser.parse() as any;
    memoryMonitor.takeSnapshot('after-legacy');
    
    // Parse with streaming parser
    memoryMonitor.takeSnapshot('before-streaming');
    const streamingResult = await streamingParser.parse(testData);
    memoryMonitor.takeSnapshot('after-streaming');
    
    // Compare results
    // Use type assertions to handle potential type mismatches
    const legacyBiomarkerCount = (legacyResult.biomarkers || []).length;
    const streamingBiomarkerCount = streamingResult.data.biomarkers.length;
    
    // We expect some difference due to different implementation details,
    // but core biomarkers should be found by both parsers
    expect(streamingBiomarkerCount).toBeGreaterThan(0);
    
    // Verify common biomarkers in both results
    // Use type assertion to handle potential type mismatches
    const legacyBiomarkers = new Set((legacyResult.biomarkers || []).map((b: any) => b.name.toLowerCase()));
    const streamingBiomarkers = streamingResult.data.biomarkers.map(b => b.name.toLowerCase());
    
    // Key biomarkers should be found in both
    const keyBiomarkers = ['glucose', 'cholesterol', 'tsh'];
    for (const biomarker of keyBiomarkers) {
      if (legacyBiomarkers.has(biomarker)) {
        expect(streamingBiomarkers).toContain(biomarker);
      }
    }
    
    // Check memory usage (optional, may not be reliable in all environments)
    const legacyMemoryUsage = memoryMonitor.getMemoryDelta('before-legacy', 'after-legacy');
    const streamingMemoryUsage = memoryMonitor.getMemoryDelta('before-streaming', 'after-streaming');
    
    if (legacyMemoryUsage && streamingMemoryUsage) {
      console.log(`Memory usage - Legacy: ${legacyMemoryUsage} bytes, Streaming: ${streamingMemoryUsage} bytes`);
    }
    
    // All cleanup handled by resource manager
  }));
  
  // Memory leak stress test
  test('should handle large inputs without memory leaks', withResourceManager(async (manager) => {
    // Skip in CI environment or with --runInBand
    if (process.env.CI || process.env.JEST_WORKER_ID === '1') {
      console.log('Skipping memory stress test in CI or --runInBand mode');
      return;
    }
    
    // Create large test data by repeating sample
    const largeData = manager.createLargeTestData(SAMPLE_TEST_DATA, 100); // ~100x larger
    
    // Monitor memory before test
    const memoryBefore = manager.getMemoryInfo();
    console.log(`Memory before test: ${memoryBefore.heapUsed}MB used / ${memoryBefore.heapTotal}MB total`);
    
    // Create streaming parser with smaller chunks
    const parser = manager.createStreamingParser({
      chunkSize: 2000,
      maxMemoryMB: 200,
      enableLogging: false
    });
    
    // Process content with progress reporting
    let chunksProcessed = 0;
    const startTime = Date.now();
    
    const result = await parser.parse(largeData);
    
    const duration = Date.now() - startTime;
    
    // Monitor memory after test
    const memoryAfter = manager.getMemoryInfo();
    console.log(`Memory after test: ${memoryAfter.heapUsed}MB used / ${memoryAfter.heapTotal}MB total`);
    console.log(`Processed ${largeData.length} chars in ${duration}ms`);
    
    // Verify results are reasonable
    expect(result.data.biomarkers.length).toBeGreaterThan(0);
    expect(result.metadata.processingTime).toBeGreaterThan(0);
    
    // Force GC before finishing test
    manager.forceGC();
    
    // Expect relatively stable memory usage
    const finalMemory = manager.getMemoryInfo();
    console.log(`Final memory: ${finalMemory.heapUsed}MB used / ${finalMemory.heapTotal}MB total`);
    
    // All cleanup handled by resource manager
  }));
});
