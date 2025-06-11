// Script to run the TypeScript admin user creation script
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Execute the TypeScript script using ts-node
  console.log('Creating admin user...');
  execSync('npx ts-node scripts/create-admin-user.ts', { 
    stdio: 'inherit',
    cwd: resolve(__dirname, '..')
  });
  console.log('Admin user creation completed.');
} catch (error) {
  console.error('Error running admin user creation script:', error);
  process.exit(1);
}
