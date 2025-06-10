# PowerShell script to test the PDF upload API

# Create a test directory if it doesn't exist
$testDir = "./test-files"
if (-not (Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
}

# Create a simple test PDF file with some sample content
$pdfPath = "$testDir/test-claim.pdf"

Write-Host "Creating a sample PDF file for testing..." -ForegroundColor Cyan
Write-Host "This is just a text file with .pdf extension for testing purposes." -ForegroundColor Yellow

# Create a simple text file with .pdf extension for testing
@"
SAMPLE MEDICAL CLAIM

Patient: John Smith
Provider: Dr. Jane Doe
NPI: 1234567890
Specimen ID: SP12345

Collection Date: 01/15/2023
Report Date: 01/20/2023

Test Results:
Cholesterol: 180 mg/dL (Reference Range: <200)
Glucose: 95 mg/dL (70-100)
HDL: 55 mg/dL (>40)
LDL: 110 mg/dL (<130)
"@ | Out-File -FilePath $pdfPath -Encoding utf8

# API endpoint
$apiUrl = "http://localhost:3000/api/claims/parse-pdf"

Write-Host "Testing PDF upload API at $apiUrl..." -ForegroundColor Cyan

# Check if the server is running
Write-Host "Checking if server is running..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "Server is running!" -ForegroundColor Green
} catch {
    Write-Host "Server does not appear to be running. Please start the server with 'npm run dev' before running this script." -ForegroundColor Red
    exit
}

Write-Host "Uploading PDF file to $apiUrl..." -ForegroundColor Cyan

# Use curl.exe (the actual curl executable) to send the file
Write-Host "Sending file using curl.exe..." -ForegroundColor Magenta

# Check if curl.exe is available
$curlExists = $null -ne (Get-Command "curl.exe" -ErrorAction SilentlyContinue)

if ($curlExists) {
    # Use curl.exe to send the request
    Write-Host "Running curl.exe command..." -ForegroundColor Yellow
    
    # Build the curl command
    $curlCommand = "curl.exe -v -F `"file=@$pdfPath`" $apiUrl"
    Write-Host $curlCommand -ForegroundColor Yellow
    
    # Execute the curl command
    $output = cmd /c $curlCommand 2>&1
    
    # Display the output
    Write-Host "Response:" -ForegroundColor Cyan
    $output | ForEach-Object { Write-Host $_ }
} else {
    # Fallback to a simple Node.js script if curl.exe is not available
    Write-Host "curl.exe not found. Creating a simple Node.js script to test the API..." -ForegroundColor Yellow
    
    $nodePath = "test-pdf-simple.js"
    
    # Create a simple Node.js script to test the API
    @"
    const fs = require('fs');
    const fetch = require('node-fetch');
    const FormData = require('form-data');
    const path = require('path');
    
    async function uploadPdf() {
      try {
        const filePath = path.resolve('$($pdfPath.Replace('\', '\\'))');
        console.log('Uploading file:', filePath);
        
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        
        const response = await fetch('$apiUrl', {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        });
        
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const responseHeaders = {};
        response.headers.forEach((value, name) => {
          responseHeaders[name] = value;
        });
        console.log('Response Headers:', JSON.stringify(responseHeaders, null, 2));
        
        const text = await response.text();
        console.log('Response Body:', text);
        
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
    
    uploadPdf();
"@ | Out-File -FilePath $nodePath -Encoding utf8
    
    Write-Host "Running Node.js script..." -ForegroundColor Yellow
    node $nodePath
}

# Instructions for manual testing
Write-Host "
Manual Testing Instructions:" -ForegroundColor Green
Write-Host "1. Make sure the Next.js development server is running (npm run dev)" -ForegroundColor White
Write-Host "2. Open a new PowerShell window" -ForegroundColor White
Write-Host "3. Run this command:" -ForegroundColor White
Write-Host "   curl -v -F 'file=@$pdfPath' $apiUrl" -ForegroundColor Cyan
Write-Host "4. Check the response for the parsed data" -ForegroundColor White
