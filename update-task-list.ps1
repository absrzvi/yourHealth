$content = Get-Content -Path ".\TASK_LIST.md" -Raw

# Update first occurrence of the CPT code generation task
$content = $content -replace "- \[ \] Enhance generateCPTCodes\(report\) with specialized helpers for blood, DNA, microbiome", "- [x] Enhance generateCPTCodes(report) with specialized helpers for blood, DNA, microbiome`n  - [x] Implemented generateBloodTestCPTCodes with biomarker mapping`n  - [x] Implemented generateDNACPTCodes with test type detection`n  - [x] Implemented generateMicrobiomeCPTCodes with site-specific coding`n  - [x] Implemented generateGenericCPTCodes as fallback"

# Update first occurrence of the charge calculation task
$content = $content -replace "- \[ \] Complete calculateCharges\(cptCodes\) with CPT price table", "- [x] Complete calculateCharges(cptCodes) with CPT price table`n  - [x] Created comprehensive pricing.ts module with default prices`n  - [x] Implemented pricing for common lab tests, panels, and specialty tests`n  - [x] Added support for bundled pricing calculations`n  - [x] Added insurance adjustment calculations"

# Write updated content back to the file
$content | Set-Content -Path ".\TASK_LIST.md"

Write-Host "Task list updated successfully!"
