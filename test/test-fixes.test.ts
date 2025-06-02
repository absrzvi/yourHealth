// test-fixes.test.ts - Simple test to verify our fixes work

import { TestResourceManager } from '../lib/parsers/utils/TestResourceManager';

describe('Memory Leak Fixes Verification', () => {
  let resourceManager: TestResourceManager;
  
  beforeEach(() => {
    resourceManager = new TestResourceManager();
  });
  
  afterEach(() => {
    resourceManager.dispose();
  });

  it('should handle string content correctly', async () => {
    const testData = 'Glucose: 95 mg/dL (70-100)';
    
    const parser = resourceManager.createLegacyParser(testData, {
      enableMonitoring: false,
      enableLogging: false
    });
    
    const result = await parser.parse();
    
    // Should not crash and should return valid structure
    expect(result).toBeDefined();
    expect(result.biomarkers).toBeDefined();
    expect(Array.isArray(result.biomarkers)).toBe(true);
    
    console.log(`✅ Parsed ${result.biomarkers.length} biomarkers successfully`);
  });

  it('should handle object content gracefully', async () => {
    // Test with object input (this was causing the "[object Object]" issue)
    const testDataObject = {
      content: 'Glucose: 95 mg/dL (70-100)',
      type: 'test'
    };
    
    const parser = resourceManager.createLegacyParser(testDataObject, {
      enableMonitoring: false,
      enableLogging: false
    });
    
    const result = await parser.parse();
    
    // Should not crash even with object input
    expect(result).toBeDefined();
    expect(result.biomarkers).toBeDefined();
    
    console.log(`✅ Handled object input gracefully`);
  });

  it('should properly dispose resources', () => {
    const parser1 = resourceManager.createLegacyParser('Test 1', { enableMonitoring: false });
    const parser2 = resourceManager.createLegacyParser('Test 2', { enableMonitoring: false });
    
    expect(resourceManager.getActiveParserCount()).toBe(2);
    
    // Resource manager should clean up automatically in afterEach
  });

  it('should handle multiple parsers without memory issues', async () => {
    const memoryBefore = resourceManager.getMemoryInfo();
    
    // Create multiple parsers
    for (let i = 0; i < 5; i++) {
      const parser = resourceManager.createLegacyParser(`Test ${i}: 100 mg/dL`, {
        enableMonitoring: false,
        enableLogging: false
      });
      
      await parser.parse();
    }
    
    const memoryAfter = resourceManager.getMemoryInfo();
    const memoryGrowth = memoryAfter.heapUsed - memoryBefore.heapUsed;
    
    console.log(`Memory growth: ${memoryGrowth}MB`);
    
    // Memory growth should be reasonable
    expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
  });
});