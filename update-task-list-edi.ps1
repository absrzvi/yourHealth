$content = Get-Content -Path ".\TASK_LIST.md" -Raw

# Update EDI 837 Generation tasks
$content = $content -replace "- \[ \] Implement EDI837Generator class with all required segment methods", "- [x] Implement EDI837Generator class with all required segment methods`n  - [x] Created basic EDI 837 structure with header, provider, subscriber, and claim segments`n  - [x] Implemented specialized generateBloodTestClaim method for biomarker-based claims`n  - [x] Added support for synthetic claim line generation from biomarkers"

# Write updated content back to the file
$content | Set-Content -Path ".\TASK_LIST.md"

Write-Host "EDI 837 Generator tasks updated in task list!"
