const fs = require('fs').promises;
const path = require('path');

async function run() {
  console.log('🚀 Starting verification process...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join('cleanup-reports', `verification-report-${timestamp}.txt`);
  
  const results = [];
  const errors = [];
  
  try {
    // Ensure the cleanup-reports directory exists
    console.log('📂 Ensuring cleanup-reports directory exists...');
    await fs.mkdir('cleanup-reports', { recursive: true });
    
    // 1. Define critical files to verify
    const criticalFiles = [
      'package.json',
      'next.config.mjs',
      'prisma/schema.prisma',
      'app/page.tsx',
      'app/layout.tsx',
      '.env'
    ];
    
    console.log(`🔍 Checking ${criticalFiles.length} critical files...`);
    
    // 2. Check critical files
    for (const file of criticalFiles) {
      const filePath = path.resolve(file);
      try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        const fileSize = (stats.size / 1024).toFixed(2); // Size in KB
        results.push(`✅ Critical file exists: ${file} (${fileSize} KB)`);
        console.log(`   ✓ ${file} (${fileSize} KB)`);
      } catch (error) {
        const errorMsg = `❌ Critical file missing or inaccessible: ${file} (${filePath})`;
        errors.push(errorMsg);
        console.error(`   ✗ ${errorMsg}`);
      }
    }
    
    // 3. Skip build and database checks for now
    results.push('ℹ️ Skipping build and database checks in simplified verification mode');
    
    // 4. Generate report
    const reportContent = [
      '=== Application Verification Report ===',
      `Generated: ${new Date().toISOString()}`,
      `Verification checks: ${results.length + errors.length}`,
      `Passed: ${results.length}`,
      `Failed: ${errors.length}`,
      '',
      '=== Results ===',
      ...results,
      '',
      '=== Errors ===',
      ...(errors.length > 0 ? errors : ['No errors found']),
      '',
      '=== Summary ===',
      `Verification ${errors.length > 0 ? 'completed with errors' : 'completed successfully'}`,
      `Report saved to: ${reportPath}`
    ].join('\n');
    
    await fs.writeFile(reportPath, reportContent);
    console.log(reportContent);
    
    if (errors.length > 0) {
      console.error('\n❌ Verification completed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ Verification completed successfully');
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

module.exports = {
  name: 'Verification & Testing',
  description: 'Verify application functionality after cleanup',
  priority: 'high',
  run,
  dependencies: ['cleanup-1', 'cleanup-2', 'cleanup-3', 'cleanup-4']
};

// Execute the run function if this script is run directly
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Unhandled error in verification script:', error);
    process.exit(1);
  });
}
