Safe Project Cleanup and Optimization
Primary Objective
Safely remove unused files from my project while ensuring the application continues to function correctly. Focus on removing test files, troubleshooting files, temporary files, and any other non-production assets that are not referenced or required by the live application.

Critical Safety Requirements
1. DEPENDENCY ANALYSIS FIRST
Before removing ANY file, perform a comprehensive analysis:

Scan all TypeScript/JavaScript files for import statements
Check all configuration files (next.config.js, tsconfig.json, package.json, etc.)
Analyze all route files (route.ts, page.tsx, layout.tsx)
Search for dynamic imports and require() statements
Look for file references in public folder assets
Check for references in CSS/SCSS files and Tailwind configs
2. BACKUP STRATEGY
Create a backup of the current project state before any deletions
Log all files that will be removed for potential recovery
Ensure git status is clean or create a commit before cleanup
3. CATEGORIZATION FRAMEWORK
Identify and categorize files into:

SAFE TO REMOVE:

*.test.js, *.test.ts, *.test.tsx (unless imported in production)
*.spec.js, *.spec.ts, *.spec.tsx
__tests__/ directories and contents
Files with "test", "debug", "temp", "backup" in filename
.DS_Store, Thumbs.db, system files
Development-only configuration files not referenced in production
Commented-out files or files with .old, .bak extensions
Empty directories
Duplicate files (same content, different names)
VERIFY BEFORE REMOVING:

Files in components/ that might be dynamically imported
Utility files that could be imported without clear naming
Image assets that might be referenced dynamically
Configuration files that might be environment-specific
Documentation files that might be linked
NEVER REMOVE:

Any file imported by production code
Core application files (pages, layouts, components in use)
Package.json, lock files, configuration files in use
Public assets referenced in the application
Environment files (.env, .env.local, etc.)
Build and deployment files
Step-by-Step Process
Step 1: Project Analysis
bash
# Analyze the project structure and create a comprehensive file inventory
# Include file sizes, last modified dates, and apparent purpose
Step 2: Dependency Mapping
bash
# Create a dependency graph showing:
# - Which files import which other files
# - Which files are entry points (pages, API routes)
# - Which files are never imported
Step 3: Safe Removal Identification
bash
# Generate a list of files that are:
# 1. Not imported by any other file
# 2. Not entry points themselves
# 3. Match the "safe to remove" patterns
# 4. Are not referenced in any configuration
Step 4: Pre-Deletion Verification
For each file identified for removal:

Confirm it's not referenced in any production file
Check if it's part of any build process
Verify it's not a dynamic import target
Ensure it's not referenced in public assets
Step 5: Staged Removal Process
Remove files in batches by category
Test application functionality after each batch
Provide rollback instructions if issues arise
Output Requirements
Please provide:

Pre-Cleanup Report:
Current project size and file count
List of identified unused files with rationale
Dependency analysis summary
Estimated space savings
Detailed Removal Plan:
Files to be removed (grouped by category)
Files that were checked but preserved (with reason)
Order of removal operations
Safety Checklist:
Confirmation that no production files reference removed files
Verification that all imports will remain valid
Test scenarios to verify application functionality
Post-Cleanup Summary:
Files successfully removed
Space reclaimed
Any issues encountered
Recommendations for ongoing maintenance
Special Considerations for My Project
This is a Next.js application with App Router
Pay special attention to dynamic imports and route files
Preserve any files related to health data processing
Be cautious with AI/ML related files and configurations
Maintain all database schema and migration files
Preserve authentication and security configurations
Emergency Recovery
Provide clear instructions for recovering removed files from backup
Include commands to restore specific files if needed
Maintain a log of all deletion operations with timestamps
Validation Steps
After cleanup completion:

Run npm run build to ensure build process works
Test key application routes and functionality
Verify all imports resolve correctly
Check that no console errors appear
Confirm all API endpoints remain functional
Start with the analysis phase and wait for my approval before proceeding with any file deletions.

