const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Main function to run the test
async function runTest() {
  try {
    console.log('Testing PDF Upload API Endpoint');
    
    // Define the API endpoint
    const apiUrl = 'http://localhost:3000/api/claims/parse-pdf';
    
    // Path to the test PDF file
    const filePath = path.join(__dirname, 'test.pdf');
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Test file not found: ${filePath}`);
      return;
    }
    
    // Create a form with the file
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: 'test.pdf',
      contentType: 'application/pdf',
    });
    
    console.log(`Sending request to ${apiUrl}...`);
    
    // Send the request
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders ? form.getHeaders() : undefined,
    });
    
    console.log(`Response status: ${response.status}`);
    
    // Get the response as JSON
    const data = await response.json();
    
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if we got a valid PDFParseResult
    if (data && data.confidence !== undefined) {
      console.log('\nPDF parsing successful!');
      console.log(`Confidence: ${data.confidence}%`);
      console.log(`Patient: ${data.patient?.firstName || ''} ${data.patient?.lastName || ''}`);
      console.log(`Provider: ${data.provider?.name || ''}`);
      console.log(`Biomarkers found: ${data.biomarkers?.length || 0}`);
    } else if (data && data.error) {
      console.log('\nPDF parsing failed with error:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

runTest();
