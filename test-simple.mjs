// Minimal test script for simple API test
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Get the directory name using ESM syntax
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the test PDF file
const pdfFilePath = path.join(__dirname, 'test-files', 'test-claim.pdf');

// API endpoint 
const apiUrl = 'http://localhost:3000/api/pdf-test';

async function testApi() {
  console.log(`Testing simple API at ${apiUrl}`);
  
  // Create form data
  const form = new FormData();
  form.append('file', fs.createReadStream(pdfFilePath));
  
  try {
    // Test POST with file upload
    console.log('Testing POST with file upload...');
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log(`POST Status: ${postResponse.status} ${postResponse.statusText}`);
    const postData = await postResponse.json().catch(() => 'Not JSON');
    console.log('POST Response:', JSON.stringify(postData, null, 2));
    
    // Test GET request
    console.log('\nTesting GET...');
    const getResponse = await fetch(apiUrl);
    
    console.log(`GET Status: ${getResponse.status} ${getResponse.statusText}`);
    const getData = await getResponse.json().catch(() => 'Not JSON');
    console.log('GET Response:', JSON.stringify(getData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test function
testApi();
