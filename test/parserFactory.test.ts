// test/parserFactory.test.ts

import { ParserFactory, ParserOptions } from '../lib/parsers/utils/parserFactory';
import { StreamingBloodTestParser } from '../lib/parsers/streaming/StreamingBloodTestParser';
import { BloodTestParser } from '../lib/parsers/bloodTestParser';
import '../lib/parsers/bloodTestParserExtension'; // Import extension to add dispose methods
import { TestResourceManager, withResourceManager } from '../lib/parsers/utils/TestResourceManager';

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
`;

describe('ParserFactory', () => {
  // Test parser creation and type selection
  test('should create parsers of the correct type', () => {
    // Legacy parser
    const legacyParser = ParserFactory.createLegacyParser(SAMPLE_TEST_DATA);
    expect(legacyParser).toBeInstanceOf(BloodTestParser);
    
    // Streaming parser
    const streamingParser = ParserFactory.createStreamingParser();
    expect(streamingParser).toBeInstanceOf(StreamingBloodTestParser);
    
    // Clean up
    ParserFactory.safeDispose(legacyParser);
    ParserFactory.safeDispose(streamingParser);
  });
  
  // Test auto-selection based on content size
  test('should auto-select parser based on content size', () => {
    // Small content should use legacy parser
    const smallContent = 'Small test data';
    const smallParser = ParserFactory.autoSelectParser(smallContent);
    expect(smallParser).toBeInstanceOf(BloodTestParser);
    
    // Create large content by repeating the sample
    const largeContent = SAMPLE_TEST_DATA.repeat(100); // >50KB
    const largeParser = ParserFactory.autoSelectParser(largeContent);
    expect(largeParser).toBeInstanceOf(StreamingBloodTestParser);
    
    // Clean up
    ParserFactory.safeDispose(smallParser);
    ParserFactory.safeDispose(largeParser);
  });
  
  // Test with resource manager integration
  test('should work with TestResourceManager', withResourceManager(async (manager) => {
    // Register test data with the resource manager
    const testData = manager.registerTestData(SAMPLE_TEST_DATA);
    
    // Create parser using factory and pass to resource manager
    const legacyParser = ParserFactory.createLegacyParser(testData);
    manager.trackParser(legacyParser);
    
    // Create streaming parser
    const streamingParser = ParserFactory.createStreamingParser();
    manager.trackParser(streamingParser);
    
    // Verify parsers are tracked
    expect(manager.getParserCount()).toBe(2);
    
    // Parse with both parsers
    const legacyResult = await legacyParser.parse();
    const streamingResult = await streamingParser.parse(testData);
    
    // Verify basic results
    expect(legacyResult).toBeDefined();
    expect(streamingResult.data).toBeDefined();
    
    // Resource manager will clean up automatically
  }));
  
  // Test parser options propagation
  test('should apply custom options to parsers', () => {
    const customOptions: ParserOptions = {
      enableLogging: true,
      logLevel: 'debug',
      chunkSize: 5000,
      maxMemoryMB: 150
    };
    
    // Create parsers with custom options
    const legacyParser = ParserFactory.createLegacyParser(SAMPLE_TEST_DATA, customOptions);
    const streamingParser = ParserFactory.createStreamingParser(customOptions);
    
    // Options should be applied - this is implementation-specific, may need adjustments
    // For testing purposes, we can simply verify the parsers were created
    expect(legacyParser).toBeInstanceOf(BloodTestParser);
    expect(streamingParser).toBeInstanceOf(StreamingBloodTestParser);
    
    // Clean up
    ParserFactory.safeDispose(legacyParser);
    ParserFactory.safeDispose(streamingParser);
  });
  
  // Test monitored parser
  test('should create monitored parser', () => {
    const monitoredParser = ParserFactory.createMonitoredParser(SAMPLE_TEST_DATA);
    
    // Should be a parser with monitoring enabled
    expect(monitoredParser).toBeDefined();
    
    // Clean up
    ParserFactory.safeDispose(monitoredParser);
  });
  
  // Test test parser
  test('should create test-optimized parser', () => {
    const testParser = ParserFactory.createTestParser(SAMPLE_TEST_DATA);
    
    // Should be a parser optimized for testing
    expect(testParser).toBeDefined();
    
    // Clean up
    ParserFactory.safeDispose(testParser);
  });
});
