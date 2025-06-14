const fs = require('fs').promises;
const path = require('path');

async function run() {
  console.log('🚀 Starting test logging task...');
  
  try {
    // Test different log levels
    console.log('📝 This is a console.log message');
    console.warn('⚠️  This is a console.warn message');
    console.error('❌ This is a console.error message');
    
    // Create a test output file
    const outputPath = path.join(process.cwd(), 'test-logging-output.txt');
    const timestamp = new Date().toISOString();
    const fileContent = `Test logging task completed successfully at ${timestamp}`;
    
    await fs.writeFile(outputPath, fileContent, 'utf8');
    console.log(`✅ Test output written to: ${outputPath}`);
    
    return {
      success: true,
      message: 'Test logging completed successfully',
      timestamp,
      outputFile: outputPath
    };
  } catch (error) {
    console.error('🔥 Error in test logging task:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  name: 'Test Logging',
  description: 'Test console logging behavior with Task Master',
  priority: 'low',
  run,
};

// Execute if run directly
if (require.main === module) {
  run().then(result => {
    if (result.success) {
      console.log('✅ Test logging completed successfully');
    } else {
      console.error('❌ Test logging failed:', result.error);
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Unhandled error in test logging script:', error);
    process.exit(1);
  });
}
