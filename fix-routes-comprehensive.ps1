# PowerShell script to comprehensively fix Next.js routing parameter conflicts
# This script standardizes all dynamic route parameters to use [id] instead of [claimId]

Write-Host "Starting comprehensive route parameter standardization..."

# Step 1: Create backup directories
Write-Host "Creating backup directories..."
New-Item -Path "app\api\claims\claimId-backup-full" -ItemType Directory -Force | Out-Null

# Step 2: Copy all content from [claimId] to backup
Write-Host "Backing up [claimId] directory content..."
if (Test-Path "app\api\claims\[claimId]") {
    Copy-Item -Path "app\api\claims\[claimId]\*" -Destination "app\api\claims\claimId-backup-full\" -Recurse -Force
}

# Step 3: Remove conflicting directories
Write-Host "Removing conflicting directories..."
if (Test-Path "app\api\claims\[claimId]") {
    Remove-Item -Path "app\api\claims\[claimId]" -Recurse -Force
}

# Step 4: Find all route.ts files in [id] directory and update parameter names
Write-Host "Updating parameter names in route files..."
Get-ChildItem -Path "app\api\claims\[id]" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updatedContent = $content -replace "params: \{ claimId: string \}", "params: { id: string }"
    $updatedContent = $updatedContent -replace "params\.claimId", "params.id"
    Set-Content -Path $_.FullName -Value $updatedContent
}

# Step 5: Create a comprehensive list of all API routes
Write-Host "Creating a comprehensive list of all API routes..."
$apiRoutes = @()
Get-ChildItem -Path "app\api\claims" -Recurse -Filter "route.ts" | ForEach-Object {
    $apiRoutes += $_.FullName
}

Write-Host "Found $($apiRoutes.Count) API route files to check"

# Step 6: Update all references to claimId in API routes
Write-Host "Updating all references to claimId in API routes..."
foreach ($routeFile in $apiRoutes) {
    Write-Host "Processing $routeFile"
    $content = Get-Content $routeFile -Raw
    
    # Skip files that don't contain claimId
    if (-not ($content -match "claimId")) {
        Write-Host "  No claimId references found, skipping"
        continue
    }
    
    # Update parameter type definitions
    $updatedContent = $content -replace "params: \{ claimId: string \}", "params: { id: string }"
    
    # Update parameter access
    $updatedContent = $updatedContent -replace "params\.claimId", "params.id"
    
    # Save the updated content
    Set-Content -Path $routeFile -Value $updatedContent
    Write-Host "  Updated and saved"
}

Write-Host "Route parameter standardization complete!"
Write-Host "All routes now use [id] as the parameter name."
