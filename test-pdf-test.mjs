// ESM-compatible test script for simplified PDF test endpoint
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdfEndpoint() {
  try {
    // Path to the test PDF file
    const filePath = path.join(__dirname, 'test-files', 'test-claim.pdf');
    console.log('Uploading file:', filePath);
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    // Send request to the simplified test API
    const apiUrl = 'http://localhost:3000/api/claims/parse-pdf-test';
    console.log(`Sending request to ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    // Log response details
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    // Log response headers
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    console.log('Response Headers:', JSON.stringify(responseHeaders, null, 2));
    
    // Get response body
    const text = await response.text();
    console.log('Response Body:', text);
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testPdfEndpoint();
