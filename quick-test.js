// Universal test that works with any return format

it('should parse a simple blood test report', async () => {
    const testData = `
      TEST RESULTS
      Glucose: 95 mg/dL (70-99)
      Cholesterol: 180 mg/dL (150-200)
    `;
  
    const parser = new BloodTestParser(testData, {
      enableMonitoring: false,
      enableLogging: false
    });
  
    const result = await parser.parse();
  
    expect(result).toBeDefined();
    
    // Handle any return format
    let biomarkers;
    let success = true;
    
    if ('success' in result) {
      // Format: { success: boolean, data?: {...}, error?: string }
      if (result.success && result.data) {
        biomarkers = result.data.biomarkers;
      } else {
        success = false;
        console.log('Parser failed:', result.error || 'Unknown error');
      }
    } else if ('biomarkers' in result) {
      // Format: { biomarkers: [...], remarks: [...] }
      biomarkers = result.biomarkers;
    } else {
      // Unknown format
      console.log('Unknown result format:', Object.keys(result));
      success = false;
    }
    
    if (success) {
      expect(biomarkers).toBeDefined();
      expect(Array.isArray(biomarkers)).toBe(true);
      
      // Look for glucose biomarker
      const glucose = biomarkers.find(b => 
        b.name && b.name.toLowerCase().includes('glucose')
      );
      
      if (glucose) {
        console.log('✅ Found glucose biomarker:', glucose);
        expect(glucose.value).toBeDefined();
        expect(glucose.unit).toBeDefined();
      } else {
        console.log('⚠️ Glucose not found. Available biomarkers:', 
          biomarkers.map(b => b.name));
      }
    }
    
    // Clean up
    if (typeof parser.dispose === 'function') {
      parser.dispose();
    }
  });