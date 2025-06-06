import { EDI837Generator } from './generator';
import { formatDate } from './utils';

/**
 * This is a test script to verify the EDI 837 generator functionality
 * It creates a sample claim and generates an EDI file
 */

// Create sample claim data
const sampleClaim = {
  id: '12345',
  claimNumber: 'CLM12345',
  totalCharge: 250.50,
  serviceDate: new Date(),
  placeOfService: '11', // Office
  user: {
    id: 'user123',
    name: 'John Q. Smith',
    email: 'john.smith@example.com'
  },
  insurancePlan: {
    id: 'ins456',
    name: 'Blue Cross Blue Shield',
    payerId: 'BCBS12345',
    memberId: 'MBR987654321',
    groupNumber: 'GRP12345'
  },
  claimLines: [
    {
      id: 'line1',
      procedureCode: '99213', // Office visit, established patient
      charge: 125.00,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['J02.9'] // Acute pharyngitis, unspecified
    },
    {
      id: 'line2',
      procedureCode: '85025', // Complete blood count (CBC)
      charge: 75.50,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['J02.9', 'R50.9'] // Adding fever
    },
    {
      id: 'line3', 
      procedureCode: '71046', // Chest X-ray
      charge: 50.00,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['J18.9'] // Pneumonia, unspecified
    }
  ]
};

// Function to test the generator
async function testEDIGenerator() {
  console.log('Creating EDI 837 generator...');
  const generator = new EDI837Generator();
  
  console.log('Generating EDI file from sample claim...');
  const ediContent = generator.generateFromClaim(sampleClaim as any);
  
  console.log('EDI file generated successfully!');
  console.log('----- EDI CONTENT PREVIEW -----');
  console.log(ediContent.slice(0, 500) + '...');
  console.log('----- END PREVIEW -----');
  
  // Write the EDI file to disk
  const fs = require('fs');
  const path = require('path');
  const today = formatDate(new Date(), 'YYYYMMDD');
  const outputPath = path.join(__dirname, `../../../test-output/edi-test-${today}.edi`);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, ediContent);
  console.log(`EDI file saved to: ${outputPath}`);
  
  return ediContent;
}

// Run the test
testEDIGenerator().catch(error => {
  console.error('Error testing EDI generator:', error);
});
