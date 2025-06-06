// Simple test script for EDI generator using TypeScript
import { EDI837Generator } from './lib/claims/edi/generator';
import { writeFileSync } from 'fs';

console.log('=== EDI 837 Generator Test ===');

// Simple claim data
const testClaim: any = {
  claimNumber: 'TEST12345',
  totalCharge: 500.75,
  user: {
    id: 'user123',
    name: 'John Smith',
    email: 'john@example.com'
  },
  insurancePlan: {
    memberId: 'MEM123456',
    groupNumber: 'GRP7890'
  },
  claimLines: [
    {
      procedureCode: '99213',
      charge: 250.50,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['J02.9']
    },
    {
      procedureCode: '85025',
      charge: 125.25,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['R50.9']
    }
  ]
};

try {
  console.log('Creating EDI generator...');
  const generator = new EDI837Generator();
  
  console.log('Generating EDI content...');
  const ediContent = generator.generateFromClaim(testClaim);
  
  console.log('\nEDI CONTENT PREVIEW:');
  console.log('-------------------');
  console.log(ediContent.substring(0, 300) + '...');
  console.log('-------------------');
  
  console.log(`\nTotal content length: ${ediContent.length} characters`);
  console.log(`Number of segments: ${(ediContent.match(/~\n/g) || []).length}`);
  
  // Save to file for inspection
  const outputPath = './edi-test-output.edi';
  writeFileSync(outputPath, ediContent);
  console.log(`\nFull content saved to: ${outputPath}`);
  
  console.log('\nGeneration completed successfully!');
} catch (error) {
  console.error('ERROR GENERATING EDI CONTENT:', error);
}
