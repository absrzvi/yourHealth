// ESM test script for new PDF parsing API
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

// API endpoint for our new PDF parser
const apiUrl = 'http://localhost:3000/api/pdf-parser';

async function uploadPdf() {
  console.log(`Uploading file: ${pdfFilePath}`);
  
  // Check if file exists
  if (!fs.existsSync(pdfFilePath)) {
    console.error(`File not found: ${pdfFilePath}`);
    return;
  }
  
  // Create form data
  const form = new FormData();
  form.append('file', fs.createReadStream(pdfFilePath));
  
  console.log(`Sending request to ${apiUrl}`);
  
  try {
    // Send request to the API
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    // Log response details
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    console.log('Response Headers:', response.headers.raw());
    
    const contentType = response.headers.get('content-type');
    console.log('Content Type:', contentType);
    
    // Get response body as text
    const responseText = await response.text();
    
    // Try to parse as JSON if the content type is JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('Parsed JSON Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log(responseText);
        console.log('Response is not valid JSON');
      }
    } else {
      console.log('Response Body:', responseText);
    }
  } catch (error) {
    console.error('Error uploading PDF:', error);
  }
}

// Run the upload function
uploadPdf();
