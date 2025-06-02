// Test script for OCR parsers - Node.js compatible version
const fs = require('fs');
const path = require('path');

// We need to mock several browser objects since we're running in Node
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.type = options.type || '';
    this._bits = bits;
  }
};

// Mock the missing browser APIs
global.Blob = class MockBlob {};

// Import our parser code
const { BloodTestParser } = require('./lib/parsers/bloodTestParser');
const { DNAParser } = require('./lib/parsers/dnaParser');
const { MicrobiomeParser } = require('./lib/parsers/microbiomeParser');

// Test each parser directly
async function testParser(filePath, parserType) {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Create a mock file object
    const mockFile = new global.File([content], fileName, {
      type: fileName.endsWith('.txt') ? 'text/plain' : 'application/octet-stream'
    });
    
    console.log(`\nTesting ${parserType} parser with ${fileName}...`);
    
    // Create the appropriate parser instance
    let parser;
    switch(parserType) {
      case 'BLOOD_TEST':
        parser = new BloodTestParser(mockFile, content);
        break;
      case 'DNA':
        parser = new DNAParser(mockFile, content);
        break;
      case 'MICROBIOME':
        parser = new MicrobiomeParser(mockFile, content);
        break;
      default:
        throw new Error(`Unknown parser type: ${parserType}`);
    }
    
    // Parse the content
    const result = await parser.parse();
    
    // Print the results
    console.log(`${parserType} parsing result:`);
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error(`Error testing ${parserType} parser:`, error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('===== TESTING PARSERS WITH SAMPLE DATA =====');
  
  // Test each parser with its appropriate sample
  await testParser('./test-data/blood-test-sample.txt', 'BLOOD_TEST');
  await testParser('./test-data/dna-sample.txt', 'DNA');
  await testParser('./test-data/microbiome-sample.txt', 'MICROBIOME');
}

runTests().catch(error => {
  console.error('Error in test execution:', error);
});
