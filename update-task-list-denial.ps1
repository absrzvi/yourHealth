$content = Get-Content -Path ".\TASK_LIST.md" -Raw

# Update Denial Pattern Tracking tasks
$content = $content -replace "- \[ \] Implement logic to track and upsert DenialPattern records on claim denial", "- [x] Implement logic to track and upsert DenialPattern records on claim denial`n  - [x] Created DenialPredictor class with comprehensive risk analysis`n  - [x] Implemented pattern tracking with weighted scoring system`n  - [x] Added detection for common denial reasons (prior auth, diagnosis codes, frequency limits, etc.)"

# Write updated content back to the file
$content | Set-Content -Path ".\TASK_LIST.md"

Write-Host "Denial Pattern Tracking tasks updated in task list!"
