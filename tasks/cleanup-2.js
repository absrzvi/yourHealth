// Dependency Mapping
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  name: 'Dependency Mapping',
  description: 'Create comprehensive dependency graph and identify unused files',
  priority: 'high',
  category: 'cleanup',
  dependsOn: ['cleanup-1'],
  run: async () => {
    const outputDir = path.join(process.cwd(), 'cleanup-reports');
    const outputPath = path.join(outputDir, 'dependency-mapping-report.txt');
    
    try {
      // Ensure reports directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString();
      let report = `Dependency Mapping Report\n`;
      report += `Generated at: ${timestamp}\n\n`;
      
      // Analyze package.json dependencies
      report += '=== Package Dependencies ===\n';
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
        report += `Dependencies (${Object.keys(packageJson.dependencies || {}).length}):\n`;
        report += Object.entries(packageJson.dependencies || {}).map(([name, version]) => `  - ${name}@${version}`).join('\n') + '\n\n';
        
        report += `Dev Dependencies (${Object.keys(packageJson.devDependencies || {}).length}):\n`;
        report += Object.entries(packageJson.devDependencies || {}).map(([name, version]) => `  - ${name}@${version}`).join('\n') + '\n\n';
      } catch (error) {
        report += `Error analyzing package.json: ${error.message}\n\n`;
      }
      
      // Save the report
      fs.writeFileSync(outputPath, report);
      
      return { 
        success: true, 
        message: `Dependency mapping report generated at: ${outputPath}`,
        reportPath: outputPath
      };
    } catch (error) {
      console.error('Error during dependency mapping:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack
      };
    }
  }
};
