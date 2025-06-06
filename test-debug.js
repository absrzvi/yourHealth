import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log('=== STARTING TEST ===');
console.log('Current directory:', process.cwd());

// Simple test
console.log('Running simple test...');
console.log('1 + 1 =', 1 + 1);

// Try to import the parser
try {
  console.log('Attempting to import DefaultEligibilityParser...');
  const modulePath = fileURLToPath(import.meta.url);
  const dirName = dirname(modulePath);
  
  // Use dynamic import
  const module = await import('./lib/claims/eligibility/parsers/default.parser.js');
  const DefaultEligibilityParser = module.default;
  
  console.log('Successfully imported DefaultEligibilityParser');
  
  // Create an instance
  console.log('Creating parser instance...');
  const parser = new DefaultEligibilityParser();
  console.log('Parser instance created successfully');
  
  // Test with simple data
  const result = await parser.parse({ isEligible: true }, {
    id: 'test-1',
    userId: 'user-1',
    payerId: 'payer-1',
    payerName: 'Test Payer',
    memberId: 'M123456789',
    groupNumber: 'GRP123',
    planType: 'PPO',
    isPrimary: true,
    isActive: true,
    effectiveDate: new Date(),
    termDate: null
  });
  
  console.log('Parse result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('Error during test:', error);
  process.exit(1);
}

console.log('=== TEST COMPLETED ===');
