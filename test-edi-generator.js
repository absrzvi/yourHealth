// Simple test script for EDI generator
// We need to use the compiled JS file from dist directory
const { EDI837Generator } = require('./dist/lib/claims/edi/generator');

console.log('=== EDI 837 Generator Test ===');

// Simple claim data
const testClaim = {
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
  console.log(`Number of segments: ${ediContent.split('~').length - 1}`);
  
  console.log('\nGeneration completed successfully!');
} catch (error) {
  console.error('ERROR GENERATING EDI CONTENT:', error);
}
