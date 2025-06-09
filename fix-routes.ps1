# PowerShell script to fix Next.js route conflicts
# This script removes the conflicting [claimId] routes

# Define paths
$basePath = "$PSScriptRoot"
$claimIdPath = "$basePath\app\api\claims\[claimId]"

# Check if the directory exists
if (Test-Path -LiteralPath $claimIdPath) {
    Write-Host "Removing conflicting [claimId] routes..."
    
    # Remove the directory and all its contents
    Remove-Item -LiteralPath $claimIdPath -Recurse -Force
    
    Write-Host "Conflicting routes removed successfully."
} else {
    Write-Host "No conflicting routes found."
}

Write-Host "Route conflict resolution complete."
