/**
 * Test script for CPT code generation
 * 
 * This script demonstrates the CPT code generation functionality in the ClaimsProcessor
 * using a manually created report object with biomarkers.
 */

import { ClaimsProcessor } from '../lib/claims/processor';
import { logger } from '../lib/logger';

// Create a sample report object for demonstration
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

// Prisma client is already mocked above

async function testCPTCodeGeneration() {
  try {
    console.log('Starting CPT code generation test');
    
    const claimsProcessor = new ClaimsProcessor();
    
    console.log('Processing sample report:', { reportId: sampleReport.id, type: sampleReport.type });
    
    const cptResults = await claimsProcessor.generateCPTCodes(sampleReport);
    
    console.log('CPT code generation results:', JSON.stringify(cptResults, null, 2));
    
    // Check if we have valid results
    if (cptResults && cptResults.length > 0) {
      console.log('\nTest successful! Generated CPT codes:');
      cptResults.forEach((r: { cpt: string; description: string; diagnoses: string[] }) => {
        console.log(`CPT: ${r.cpt} - ${r.description}`);
        console.log(`Diagnoses: ${r.diagnoses.join(', ')}`);
        console.log('-----------------------------------');
      });
    } else {
      console.error('Test failed! No CPT codes generated.');
    }
  } catch (error) {
    console.error('Error during CPT code generation test:', error);
  }
}

// Run the test
testCPTCodeGeneration().then(() => {
  logger.info('Test completed');
  process.exit(0);
}).catch(error => {
  logger.error('Test failed with error:', error);
  process.exit(1);
});
