const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testPdfUpload() {
  try {
    console.log('Testing PDF Upload with simple approach');
    
    // Define the API endpoint
    const apiUrl = 'http://localhost:3000/api/claims/parse-pdf';
    
    // Path to the test PDF file
    const filePath = path.join(__dirname, 'test.pdf');
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Test file not found: ${filePath}`);
      return;
    }
    
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    // Create a form with the file
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: 'test.pdf',
      contentType: 'application/pdf',
    });
    
    console.log(`Sending request to ${apiUrl}...`);
    
    // Get headers from form
    const formHeaders = form.getHeaders();
    console.log('Form headers:', formHeaders);
    
    // Send the request
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: formHeaders,
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    // Try to get the response as text first
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Try to parse as JSON if possible
    try {
      const data = JSON.parse(responseText);
      console.log('Response data (parsed):');
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }
    
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

testPdfUpload();
