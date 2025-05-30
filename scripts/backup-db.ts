import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create backups directory if it doesn't exist
const backupsDir = path.join(process.cwd(), 'prisma/backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log(`Created backups directory at ${backupsDir}`);
}

// Create a timestamp for the backup file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `dev_${timestamp}.db`;
const backupPath = path.join(backupsDir, backupFileName);

// Copy the database file
const dbPath = path.join(process.cwd(), 'prisma/dev.db');

if (!fs.existsSync(dbPath)) {
  console.error('Error: Database file not found at', dbPath);
  process.exit(1);
}

try {
  // Use native file copy
  fs.copyFileSync(dbPath, backupPath);
  
  console.log(`✅ Database backup created successfully at: ${backupPath}`);
  
  // List all backups
  const files = fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.db'))
    .sort()
    .reverse();
  
  console.log('\n📋 Available backups:');
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(backupsDir, file));
    console.log(`${index + 1}. ${file} (${formatFileSize(stats.size)})`);
  });
  
} catch (error) {
  console.error('❌ Error creating database backup:', error);
  process.exit(1);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
