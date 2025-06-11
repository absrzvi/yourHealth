Write-Host "Testing PDF Upload API Endpoint" -ForegroundColor Green

# Define the API endpoint
$apiUrl = "http://localhost:3000/api/claims/parse-pdf"

# Path to the test PDF file
$filePath = ".\test.pdf"

# Check if the file exists
if (-not (Test-Path $filePath)) {
    Write-Host "Error: Test PDF file not found at $filePath" -ForegroundColor Red
    exit 1
}

Write-Host "Sending request to $apiUrl..." -ForegroundColor Yellow

# Generate a boundary for multipart/form-data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

# Read file content
$fileContent = [System.IO.File]::ReadAllBytes($filePath)
$fileContentBase64 = [System.Convert]::ToBase64String($fileContent)

# Create the multipart/form-data content
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test.pdf`"",
    "Content-Type: application/pdf",
    "",
    [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($fileContentBase64)),
    "--$boundary--"
)

$body = $bodyLines -join $LF

try {
    # Send the request
    $headers = @{
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    $response = Invoke-WebRequest -Uri $apiUrl -Method Post -Body $body -Headers $headers -ErrorAction Stop
    
    # Display the response
    Write-Host "Response received:" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content:" -ForegroundColor Green
    $response.Content
    
    # Try to parse as JSON if possible
    try {
        $jsonContent = $response.Content | ConvertFrom-Json
        Write-Host "Parsed JSON:" -ForegroundColor Green
        $jsonContent | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "Response is not valid JSON" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        Write-Host "Status Code: $statusCode - $statusDescription" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body:" -ForegroundColor Red
            Write-Host $responseBody
        }
        catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
}
