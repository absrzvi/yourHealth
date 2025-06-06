import { EDI837Generator } from './generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Manual test script for the EDI 837 generator
 * This creates a sample claim and generates an EDI file with all segments
 * You can inspect the output file to verify the format is correct
 */

console.log('=== EDI 837 Generator Manual Test ===');

// Create sample claim data
const testClaim = {
  id: 'test-claim-123',
  claimNumber: 'TEST12345',
  totalCharge: 850.75,
  serviceDate: new Date(),
  placeOfService: '11', // Office
  userId: 'user-123',
  user: {
    id: 'user-123',
    name: 'John Smith',
    email: 'john.smith@example.com'
  },
  insurancePlanId: 'ins-456',
  insurancePlan: {
    id: 'ins-456',
    userId: 'user-123',
    payerName: 'Blue Cross Blue Shield',
    payerId: 'BCBS54321',
    memberId: 'MEM9876543210',
    groupNumber: 'GRP5432100',
    planType: 'PPO',
    isPrimary: true,
    isActive: true
  },
  claimLines: [
    {
      id: 'line-1',
      claimId: 'test-claim-123',
      lineNumber: 1,
      cptCode: '99214', // Office visit, established patient, moderate complexity
      description: 'Office visit, moderate',
      charge: 250.00,
      units: 1,
      modifier: 'GP',
      serviceDate: new Date(),
      icd10Codes: ['J02.9'] // Acute pharyngitis
    },
    {
      id: 'line-2',
      claimId: 'test-claim-123',
      lineNumber: 2,
      cptCode: '87880', // Strep test
      description: 'Strep A test',
      charge: 150.75,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['J02.9'] 
    },
    {
      id: 'line-3',
      claimId: 'test-claim-123', 
      lineNumber: 3,
      cptCode: '90715', // Tdap vaccine
      description: 'Tdap immunization',
      charge: 450.00,
      units: 1,
      serviceDate: new Date(),
      icd10Codes: ['Z23'] // Immunization encounter
    }
  ]
};

// Create custom config (optional)
const customConfig = {
  isProduction: false,
  tradingPartnerId: 'TEST0001',
  receiverId: 'RECTEST01',
  defaultPlaceOfService: '11',
  providerInfo: {
    npi: '1234567890',
    organizationName: 'TEST CLINIC',
    name: 'TEST CLINIC', 
    taxId: '123456789',
    taxIdType: 'EIN',
    address1: '123 MEDICAL PLAZA',
    city: 'TESTVILLE',
    state: 'TX',
    zip: '12345',
    contactName: 'OFFICE MANAGER',
    contactPhone: '5551234567'
  }
};

// Create the generator with custom config
const generator = new EDI837Generator(customConfig);

try {
  console.log('Generating EDI file from test claim...');
  
  // Generate the EDI file content
  const ediContent = generator.generateFromClaim(testClaim as any);
  
  // Create an output file path using timestamp to keep files unique
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(__dirname, '../../../test-output');
  const outputPath = join(outputDir, `edi-test-${timestamp}.edi`);
  
  // Ensure the output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the EDI content to a file
  writeFileSync(outputPath, ediContent);
  
  console.log(`EDI file successfully generated and saved to: ${outputPath}`);
  console.log('\nFirst 500 characters preview:');
  console.log('----------------------------');
  console.log(ediContent.substring(0, 500));
  console.log('----------------------------');
  console.log(`\nTotal length: ${ediContent.length} characters`);
  
  // Count segments for verification
  const segmentCount = (ediContent.match(/~\n/g) || []).length;
  console.log(`Total segments: ${segmentCount}`);
  
  // Show a few key segments by searching for them
  console.log('\nKey segments found:');
  
  const showSegment = (prefix: string, description: string) => {
    const regex = new RegExp(`${prefix}[^~]*~`, 'g');
    const matches = ediContent.match(regex);
    if (matches && matches.length > 0) {
      console.log(`- ${description}: ${matches.length} found`);
      console.log(`  Example: ${matches[0].replace('\n', '')}`);
    } else {
      console.log(`- ${description}: MISSING!`);
    }
  };
  
  showSegment('ISA\\*', 'Interchange Control Header');
  showSegment('GS\\*', 'Functional Group Header');
  showSegment('ST\\*', 'Transaction Set Header');
  showSegment('BHT\\*', 'Beginning of Hierarchical Transaction');
  showSegment('NM1\\*85\\*', 'Billing Provider Name');
  showSegment('NM1\\*IL\\*', 'Subscriber Name');
  showSegment('CLM\\*', 'Claim Information');
  showSegment('SV1\\*', 'Professional Service');
  showSegment('SE\\*', 'Transaction Set Trailer');
  
  console.log('\nTest completed successfully!');
  
} catch (error) {
  console.error('Error generating EDI file:', error);
}
