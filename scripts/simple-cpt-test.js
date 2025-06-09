/**
 * Simple test script for CPT code generation logic
 * 
 * This script demonstrates the core CPT code generation logic without dependencies
 * to help verify the implementation is working correctly.
 */

// Simplified version of the biomarker category to ICD-10 mapping
const biomarkerCategoryToDiagnosis = {
  'Metabolic': ['E88.9'],
  'Liver': ['R74.8', 'K76.9'],
  'Kidney': ['N28.9'],
  'Hematology': ['D64.9'],
  'Lipids': ['E78.5'],
  'Electrolytes': ['E87.8'],
  'Thyroid': ['E07.9'],
  'Inflammatory': ['R70.0'],
  'Protein': ['R77.9'],
  'Vitamin': ['E56.9']
};

// Simplified version of the lab test to CPT code mapping
const labTestCPTMap = {
  "CMP": "80053",
  "BMP": "80048",
  "CBC": "85025",
  "LIPID": "80061",
  "TSH": "84443",
  "GLUCOSE": "82947",
  "CREATININE": "82565",
  "ALT": "84460",
  "AST": "84450",
  "CHOLESTEROL": "82465",
  "HDL": "83718",
  "LDL": "83721",
  "TRIGLYCERIDES": "84478"
};

// Sample report data
const sampleReport = {
  id: 'test-report-id',
  type: 'BLOOD_TEST',
  parsedData: JSON.stringify({
    biomarkers: [
      { name: 'Glucose', value: 100, unit: 'mg/dL', category: 'Metabolic' },
      { name: 'Hemoglobin', value: 14, unit: 'g/dL', category: 'Hematology' },
      { name: 'ALT', value: 30, unit: 'U/L', category: 'Liver' },
      { name: 'AST', value: 35, unit: 'U/L', category: 'Liver' },
      { name: 'Total Cholesterol', value: 200, unit: 'mg/dL', category: 'Lipids' },
      { name: 'HDL', value: 50, unit: 'mg/dL', category: 'Lipids' },
      { name: 'LDL', value: 120, unit: 'mg/dL', category: 'Lipids' },
      { name: 'Triglycerides', value: 150, unit: 'mg/dL', category: 'Lipids' },
      { name: 'Sodium', value: 140, unit: 'mmol/L', category: 'Electrolytes' },
      { name: 'Potassium', value: 4.5, unit: 'mmol/L', category: 'Electrolytes' },
      { name: 'Chloride', value: 102, unit: 'mmol/L', category: 'Electrolytes' },
      { name: 'TSH', value: 2.5, unit: 'mIU/L', category: 'Thyroid' }
    ]
  })
};

/**
 * Simplified CPT code generation function
 */
function generateCPTCodes(report) {
  console.log('Generating CPT codes for report:', report.id);
  
  const cptCodes = [];
  const diagnoses = new Set();
  
  try {
    // Parse the report data
    let parsedData = null;
    if (report.parsedData) {
      try {
        parsedData = JSON.parse(report.parsedData);
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
    }
    
    // Extract biomarkers from parsed data
    const biomarkers = parsedData?.biomarkers || [];
    console.log(`Found ${biomarkers.length} biomarkers in report`);
    
    // Map biomarkers to categories and collect diagnosis codes
    const biomarkerCategories = new Set();
    biomarkers.forEach(biomarker => {
      if (biomarker.category) {
        biomarkerCategories.add(biomarker.category);
        
        // Add diagnosis codes for this category
        const diagnosisCodes = biomarkerCategoryToDiagnosis[biomarker.category] || [];
        diagnosisCodes.forEach(code => diagnoses.add(code));
      }
    });
    
    console.log('Biomarker categories found:', Array.from(biomarkerCategories));
    
    // Generate CPT codes based on biomarker names
    const biomarkerNames = biomarkers.map(b => b.name.toUpperCase());
    
    // Check for specific tests
    for (const [testName, cptCode] of Object.entries(labTestCPTMap)) {
      if (biomarkerNames.some(name => name.includes(testName))) {
        cptCodes.push(cptCode);
      }
    }
    
    // If we have a comprehensive set of biomarkers, add panel codes
    if (biomarkerCategories.size >= 3) {
      if (biomarkerCategories.has('Metabolic') && biomarkerCategories.has('Electrolytes')) {
        cptCodes.push('80053'); // CMP
      }
      
      if (biomarkerCategories.has('Lipids')) {
        cptCodes.push('80061'); // Lipid Panel
      }
      
      if (biomarkerCategories.has('Hematology')) {
        cptCodes.push('85025'); // CBC
      }
    }
    
    // Deduplicate CPT codes
    const uniqueCptCodes = Array.from(new Set(cptCodes));
    
    // If no CPT codes were generated, use a default
    if (uniqueCptCodes.length === 0) {
      uniqueCptCodes.push('80050'); // General health panel
      diagnoses.add('Z00.00'); // General health check
    }
    
    // If no diagnoses were found, add a default
    if (diagnoses.size === 0) {
      diagnoses.add('Z00.00'); // General health check
    }
    
    // Format the results
    const results = uniqueCptCodes.map(cpt => ({
      cpt,
      description: `CPT Code ${cpt} Description`,
      diagnoses: Array.from(diagnoses)
    }));
    
    return results;
  } catch (error) {
    console.error('Error generating CPT codes:', error);
    
    // Return default CPT code in case of error
    return [{
      cpt: '80050',
      description: 'General Health Panel',
      diagnoses: ['Z00.00']
    }];
  }
}

// Run the test
try {
  console.log('Starting CPT code generation test');
  const results = generateCPTCodes(sampleReport);
  
  console.log('\nGenerated CPT codes:');
  results.forEach(result => {
    console.log(`CPT: ${result.cpt} - ${result.description}`);
    console.log(`Diagnoses: ${result.diagnoses.join(', ')}`);
    console.log('-----------------------------------');
  });
  
  console.log('Test completed successfully');
} catch (error) {
  console.error('Test failed with error:', error);
}
