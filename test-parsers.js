// Test script for OCR parsers
const fs = require('fs');
const path = require('path');
const { ParserFactory } = require('./lib/parsers/parserFactory');

// Mock the File object since it's not available in Node.js
global.File = class File {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.type = options.type || '';
    this._bits = bits;
  }
};


async function testParser(filePath, fileType) {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Create a mock File object
  const mockFile = new File([content], fileName, {
    type: 'text/plain'
  });

  // First test report type detection
  console.log(`\nTesting ${fileName} for type detection...`);
  const detectedType = await ParserFactory.detectReportType(mockFile, content);
  console.log(`Detected report type: ${detectedType || 'Unknown'}`);
  
  // Now test parsing with the detected or specified type
  const reportType = fileType || detectedType;
  if (reportType) {
    console.log(`\nTesting ${reportType} parser with ${fileName}...`);
    const parser = await ParserFactory.createParser(mockFile, reportType, content);
    const result = await parser.parse();
    console.log('Parsing result:');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Could not detect report type for testing');
  }
}

// Test all sample files
async function runTests() {
  console.log('===== TESTING PARSERS WITH SAMPLE DATA =====');
  
  try {
    // Store test results
    const results = {
      bloodTest: null,
      dna: null,
      microbiome: null,
      autoDetection: {}
    };
    
    // Test with explicit types
    console.log('\nTesting Blood Test Parser...');
    await testParser('./test-data/blood-test-sample.txt', 'BLOOD_TEST')
      .then(result => results.bloodTest = result)
      .catch(err => console.error('Blood test parser error:', err));
      
    console.log('\nTesting DNA Parser...');
    await testParser('./test-data/dna-sample.txt', 'DNA')
      .then(result => results.dna = result)
      .catch(err => console.error('DNA parser error:', err));
      
    console.log('\nTesting Microbiome Parser...');
    await testParser('./test-data/microbiome-sample.txt', 'MICROBIOME')
      .then(result => results.microbiome = result)
      .catch(err => console.error('Microbiome parser error:', err));
    
    // Test automatic detection
    console.log('\n===== TESTING AUTOMATIC TYPE DETECTION =====');
    
    console.log('\nAuto-detecting Blood Test...');
    await testParser('./test-data/blood-test-sample.txt')
      .then(result => results.autoDetection.bloodTest = result)
      .catch(err => console.error('Auto blood test error:', err));
      
    console.log('\nAuto-detecting DNA...');
    await testParser('./test-data/dna-sample.txt')
      .then(result => results.autoDetection.dna = result)
      .catch(err => console.error('Auto DNA error:', err));
      
    console.log('\nAuto-detecting Microbiome...');
    await testParser('./test-data/microbiome-sample.txt')
      .then(result => results.autoDetection.microbiome = result)
      .catch(err => console.error('Auto microbiome error:', err));
    
    // Summary
    console.log('\n===== TEST RESULTS SUMMARY =====');
    console.log('Blood Test Parser:', results.bloodTest ? 'SUCCESS' : 'FAILED');
    console.log('DNA Parser:', results.dna ? 'SUCCESS' : 'FAILED');
    console.log('Microbiome Parser:', results.microbiome ? 'SUCCESS' : 'FAILED');
    console.log('\nAuto Detection:');
    console.log('- Blood Test:', results.autoDetection.bloodTest ? `SUCCESS (${results.autoDetection.bloodTest})` : 'FAILED');
    console.log('- DNA:', results.autoDetection.dna ? `SUCCESS (${results.autoDetection.dna})` : 'FAILED');
    console.log('- Microbiome:', results.autoDetection.microbiome ? `SUCCESS (${results.autoDetection.microbiome})` : 'FAILED');
    
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Return result for chaining
function testParser(filePath, fileType) {
  return new Promise(async (resolve, reject) => {
    try {
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      // Create a mock File object
      const mockFile = new File([content], fileName, {
        type: 'text/plain'
      });

      // First test report type detection
      console.log(`Testing ${fileName} for type detection...`);
      const detectedType = await ParserFactory.detectReportType(mockFile, content);
      console.log(`Detected report type: ${detectedType || 'Unknown'}`);
      
      // Now test parsing with the detected or specified type
      const reportType = fileType || detectedType;
      if (reportType) {
        console.log(`Testing ${reportType} parser with ${fileName}...`);
        const parser = await ParserFactory.createParser(mockFile, reportType, content);
        const result = await parser.parse();
        console.log('Parsing result:', JSON.stringify(result, null, 2));
        resolve(reportType);
      } else {
        console.log('Could not detect report type for testing');
        resolve(null);
      }
    } catch (error) {
      console.error(`Error testing ${filePath}:`, error);
      reject(error);
    }
  });
}

runTests();
