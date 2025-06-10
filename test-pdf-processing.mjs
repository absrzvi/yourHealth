// ESM test script for PDF processing API
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

// New API endpoint 
const apiUrl = 'http://localhost:3000/api/pdf-processing';

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
    
    const contentType = response.headers.get('content-type');
    console.log('Content Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      
      // Check if we got the expected data structure
      if (data.success && data.data) {
        console.log('\nParsed Data Summary:');
        const parsedData = data.data;
        
        // Patient info
        if (parsedData.patient) {
          console.log('\nPatient Information:');
          console.log('- Name:', parsedData.patient.patientName || 'Not found');
          console.log('- DOB:', parsedData.patient.patientDOB || 'Not found');
        }
        
        // Insurance info
        if (parsedData.insurance) {
          console.log('\nInsurance Information:');
          console.log('- Company:', parsedData.insurance.insuranceCompany || 'Not found');
          console.log('- Member ID:', parsedData.insurance.memberId || 'Not found');
          console.log('- Group Number:', parsedData.insurance.groupNumber || 'Not found');
        }
        
        // Provider info
        if (parsedData.provider) {
          console.log('\nProvider Information:');
          console.log('- Name:', parsedData.provider.providerName || 'Not found');
          console.log('- NPI:', parsedData.provider.providerNPI || 'Not found');
        }
        
        // Claim info
        if (parsedData.claim) {
          console.log('\nClaim Information:');
          console.log('- Claim Number:', parsedData.claim.claimNumber || 'Not found');
          console.log('- Date of Service:', parsedData.claim.dateOfService || 'Not found');
          console.log('- Total Amount:', parsedData.claim.totalAmount || 'Not found');
          
          if (parsedData.claim.diagnosis && parsedData.claim.diagnosis.length > 0) {
            console.log('- Diagnosis Codes:', parsedData.claim.diagnosis.join(', '));
          }
          
          if (parsedData.claim.cptCodes && parsedData.claim.cptCodes.length > 0) {
            console.log('- CPT Codes:', parsedData.claim.cptCodes.join(', '));
          }
        }
      }
    } else {
      const text = await response.text();
      console.log('Response (non-JSON):', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }
  } catch (error) {
    console.error('Error uploading PDF:', error);
  }
}

// Run the upload function
uploadPdf();
