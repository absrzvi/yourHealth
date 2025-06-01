console.log('Starting test script...');

// Mock required globals
console.log('Setting up global mocks...');
(global as any).TextEncoder = class {
  encode(text: string) {
    return Buffer.from(text);
  }
};

(global as any).TextDecoder = class {
  decode(buffer: Buffer) {
    return buffer.toString('utf8');
  }
};

// Import after setting up globals
console.log('Importing BloodTestParser...');
const { BloodTestParser } = require('../lib/parsers/bloodTestParser');

async function runTest() {
  console.log('🚀 Starting blood test parser test...');
  
  try {
    // Create a simple test case
    const testData = `
      PATIENT INFORMATION
      Name: Test Patient
      DOB: 01/01/1980
      
      TEST RESULTS
      Glucose: 95 mg/dL (70-99)
      
      REMARKS
      No significant findings
    `;

    console.log('📝 Test data created');
    console.log('Creating parser instance...');
    
    const parser = new BloodTestParser(null, testData);
    console.log('✅ Parser instance created');
    
    console.log('🔄 Starting to parse test data...');
    const result = await parser.parse();
    
    console.log('📊 Test completed. Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Test passed!');
      process.exit(0);
    } else {
      console.error('❌ Test failed with error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('🔥 Test failed with unhandled exception:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
console.log('Starting test execution...');
runTest().catch(error => {
  console.error('🔥 Unhandled promise rejection:');
  console.error(error);
  process.exit(1);
});
