const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function removeFileOrDir(itemPath) {
  try {
    const stats = await fs.lstat(itemPath);
    
    if (stats.isDirectory()) {
      // Remove directory using Node's fs.rm (recursive: true is available in Node 14+)
      await fs.rm(itemPath, { recursive: true, force: true });
      return { path: itemPath, type: 'directory', success: true };
    } else if (stats.isFile() || stats.isSymbolicLink()) {
      // Remove file or symlink
      await fs.unlink(itemPath);
      return { path: itemPath, type: 'file', success: true };
    }
    
    return { 
      path: itemPath, 
      type: 'unknown', 
      success: false, 
      error: 'Not a file or directory' 
    };
    
  } catch (error) {
    // If fs.rm fails (older Node versions), fall back to exec
    if (error.code === 'ERR_METHOD_NOT_IMPLEMENTED' || 
        error.message.includes('recursive') ||
        error.code === 'ENOENT') {
      try {
        // Use Windows rmdir /s /q for directories
        const isWindows = process.platform === 'win32';
        const cmd = isWindows 
          ? `rmdir /s /q "${itemPath}"`
          : `rm -rf "${itemPath}"`;
        
        await execPromise(cmd);
        return { path: itemPath, type: 'directory', success: true };
      } catch (execError) {
        return { 
          path: itemPath, 
          type: 'unknown', 
          success: false, 
          error: `Fallback failed: ${execError.message}` 
        };
      }
    }
    
    return { 
      path: itemPath, 
      type: 'unknown', 
      success: false, 
      error: error.message 
    };
  }
}

async function run() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join('cleanup-reports', `cleanup-summary-${timestamp}.txt`);
  const safeToRemovePath = path.join('cleanup-reports', 'safe-to-remove.txt');
  
  try {
    // Ensure the cleanup-reports directory exists
    await fs.mkdir('cleanup-reports', { recursive: true });
    
    // Read the list of files/directories to remove
    const data = await fs.readFile(safeToRemovePath, 'utf8');
    const itemsToRemove = data.split('\n').filter(item => item.trim() !== '');
    
    const results = [];
    const errors = [];
    
    // Process each item
    for (const item of itemsToRemove) {
      if (!item.trim()) continue;
      
      try {
        const result = await removeFileOrDir(item);
        if (result.success) {
          results.push(`✅ Removed ${result.type}: ${item}`);
        } else {
          errors.push(`❌ Failed to remove ${item}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`❌ Error processing ${item}: ${error.message}`);
      }
    }
    
    // Generate report
    const reportContent = [
      '=== Cleanup Summary Report ===',
      `Generated at: ${new Date().toISOString()}`,
      `Total items processed: ${itemsToRemove.length}`,
      `Successfully removed: ${results.length}`,
      `Failed to remove: ${errors.length}`,
      '\n=== Removed Items ===',
      ...results,
      '\n=== Errors ===',
      ...(errors.length > 0 ? errors : ['No errors']),
      '\n=== End of Report ===',
    ];
    
    // Ensure the directory exists before writing
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    // Write the report
    const reportString = reportContent.join('\n');
    await fs.writeFile(reportPath, reportString);
    
    // Log the report path for debugging
    console.log(`Cleanup report generated at: ${path.resolve(reportPath)}`);
    
    return {
      success: true,
      reportPath,
      totalItems: itemsToRemove.length,
      removed: results.length,
      errors: errors.length,
    };
    
  } catch (error) {
    const errorMessage = `❌ Error during cleanup: ${error.message}`;
    await fs.writeFile(reportPath, errorMessage);
    return {
      success: false,
      error: error.message,
      reportPath
    };
  }
}

module.exports = {
  name: 'Safe Cleanup Execution',
  description: 'Safely remove identified unnecessary files and directories',
  priority: 'high',
  category: 'cleanup',
  dependsOn: ['cleanup-3'],
  run
};
