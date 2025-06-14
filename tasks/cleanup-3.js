// Safe Removal Identification
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { glob } = require('glob');

// Common directories and files that are often safe to remove
const COMMON_SAFE_TO_REMOVE = [
  '.DS_Store',
  'Thumbs.db',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.idea',
  '.vscode',
  '*.log',
  'cleanup-reports/verification-report-*.txt'
];

// Directories that might contain build artifacts
const BUILD_ARTIFACT_DIRS = [
  '.next',
  'build',
  'dist',
  'out',
  'node_modules'
];

// File extensions that might be safe to remove
const SAFE_EXTENSIONS = [
  '.log',
  '.tmp',
  '.temp',
  '.bak',
  '.swp',
  '.swo',
  '~'
];

module.exports = {
  name: 'Safe Removal Identification',
  description: 'Categorize files for potential removal and create backup',
  priority: 'high',
  category: 'cleanup',
  dependsOn: ['cleanup-2'],
  run: async () => {
    const outputDir = path.join(process.cwd(), 'cleanup-reports');
    const outputPath = path.join(outputDir, 'safe-removal-report.txt');
    const backupDir = path.join(process.cwd(), 'backup-before-cleanup');
    
    try {
      // Ensure reports directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString();
      let report = `Safe Removal Identification Report\n`;
      report += `Generated at: ${timestamp}\n\n`;
      
      // Create a backup of potentially removable files
      report += '=== Backup Creation ===\n';
      try {
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
          report += `Backup directory created at: ${backupDir}\n`;
        } else {
          report += `Backup directory already exists at: ${backupDir}\n`;
        }
      } catch (error) {
        report += `Warning: Could not create backup directory: ${error.message}\n`;
      }
      
      // Identify potentially safe-to-remove files
      report += '\n=== Potentially Safe to Remove ===\n';
      const safeToRemove = [];
      
      // Check for common safe-to-remove files using glob for better pattern matching
      for (const pattern of COMMON_SAFE_TO_REMOVE) {
        try {
          // Convert Windows path separators to forward slashes for glob
          const normalizedPattern = pattern.replace(/\\/g, '/');
          const files = await glob(normalizedPattern, { 
            dot: true, 
            absolute: true,
            ignore: ['**/node_modules/**', '**/.git/**']
          });
          
          if (files.length > 0) {
            // Convert paths to use Windows backslashes for consistency
            const windowsPaths = files.map(f => f.replace(/\//g, '\\'));
            safeToRemove.push(...windowsPaths);
            report += `Found ${files.length} files matching ${pattern}\n`;
          }
        } catch (error) {
          report += `Error processing pattern ${pattern}: ${error.message}\n`;
        }
      }
      
            // Check for build artifact directories
      for (const dir of BUILD_ARTIFACT_DIRS) {
        try {
          const dirPath = path.join(process.cwd(), dir);
          if (fs.existsSync(dirPath)) {
            // Convert to Windows path for consistency
            const windowsPath = dirPath.replace(/\//g, '\\');
            safeToRemove.push(windowsPath);
            report += `Found build artifact directory: ${windowsPath}\n`;
          }
        } catch (error) {
          report += `Error checking directory ${dir}: ${error.message}\n`;
        }
      }
      
      // Save the list of safe-to-remove files
      const safeToRemovePath = path.join(outputDir, 'safe-to-remove.txt');
      fs.writeFileSync(safeToRemovePath, safeToRemove.join('\n'));
      
      report += `\nFound ${safeToRemove.length} potentially safe-to-remove items.\n`;
      report += `List saved to: ${safeToRemovePath}\n`;
      
      // Save the report
      fs.writeFileSync(outputPath, report);
      
      return { 
        success: true, 
        message: `Safe removal identification report generated at: ${outputPath}`,
        reportPath: outputPath,
        safeToRemoveCount: safeToRemove.length,
        safeToRemovePath: safeToRemovePath
      };
    } catch (error) {
      console.error('Error during safe removal identification:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack
      };
    }
  }
};
