// Test Task
const fs = require('fs').promises;
const path = require('path');

async function run() {
  console.log('🚀 Starting test task...');
  
  const outputPath = path.join(process.cwd(), 'taskmaster-test-output.txt');
  const timestamp = new Date().toISOString();
  const message = `Test task executed successfully!\n` +
    `Timestamp: ${timestamp}\n` +
    `This confirms that Task Master is working correctly.\n`;
  
  try {
    console.log(`📝 Writing test output to: ${outputPath}`);
    await fs.writeFile(outputPath, message, 'utf8');
    
    // Verify the file was written
    const stats = await fs.stat(outputPath);
    const fileSize = (stats.size / 1024).toFixed(2); // Size in KB
    
    console.log(`✅ Successfully wrote ${fileSize} KB to ${outputPath}`);
    
    return {
      success: true,
      message: 'Test task completed successfully',
      timestamp,
      outputPath,
      fileSize: `${fileSize} KB`
    };
  } catch (error) {
    const errorMsg = `❌ Error in test task: ${error.message}`;
    console.error(errorMsg);
    
    return {
      success: false,
      error: error.message,
      timestamp,
      outputPath
    };
  }
}

module.exports = {
  name: 'Test Task',
  description: 'A simple test task to verify Task Master functionality',
  priority: 'low',
  run,
};

// Execute if run directly
if (require.main === module) {
  run().then(result => {
    if (result.success) {
      console.log('✅ Test task completed successfully');
      console.log(`📄 Output file: ${result.outputPath}`);
      console.log(`📏 File size: ${result.fileSize}`);
    } else {
      console.error('❌ Test task failed:', result.error);
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Unhandled error in test task:', error);
    process.exit(1);
  });
}
