# PowerShell script to fix the Next.js routing parameter conflict
# This script standardizes all dynamic route parameters to use [id] instead of [claimId]

# Create backup directories
Write-Host "Creating backup directories..."
New-Item -Path "app\api\claims\claimId-backup" -ItemType Directory -Force | Out-Null

# Copy content from [claimId] to backup
Write-Host "Backing up [claimId] directory content..."
Get-ChildItem -Path "app\api\claims\[claimId]" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\app\api\claims\[claimId]\", "")
    if ($_.PSIsContainer) {
        New-Item -Path "app\api\claims\claimId-backup\$relativePath" -ItemType Directory -Force | Out-Null
    } else {
        Copy-Item -Path $_.FullName -Destination "app\api\claims\claimId-backup\$relativePath" -Force
    }
}

# Move content from [claimId] to [id]
Write-Host "Moving content from [claimId] to [id]..."
Get-ChildItem -Path "app\api\claims\[claimId]" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\app\api\claims\[claimId]\", "")
    if (-not $_.PSIsContainer) {
        $targetDir = Split-Path -Path "app\api\claims\[id]\$relativePath" -Parent
        if (-not (Test-Path $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination "app\api\claims\[id]\$relativePath" -Force
    }
}

# Update parameter names in route files
Write-Host "Updating parameter names in route files..."
Get-ChildItem -Path "app\api\claims\[id]" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updatedContent = $content -replace "params: \{ claimId: string \}", "params: { id: string }"
    $updatedContent = $updatedContent -replace "params\.claimId", "params.id"
    Set-Content -Path $_.FullName -Value $updatedContent
}

# Remove the [claimId] directory
Write-Host "Removing [claimId] directory..."
Remove-Item -Path "app\api\claims\[claimId]" -Recurse -Force

Write-Host "Route parameter standardization complete!"
Write-Host "All routes now use [id] as the parameter name."
