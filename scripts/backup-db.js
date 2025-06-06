const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'prisma', 'backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
    const sourceDb = path.join(__dirname, '..', 'prisma', 'dev.db');

    // Create backups directory if it doesn't exist
    await fs.ensureDir(backupDir);

    // Copy the database file
    await fs.copyFile(sourceDb, backupFile);
    
    console.log(`Database backup created at: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Error creating database backup:', error);
    process.exit(1);
  }
}

// Run the backup
backupDatabase();
