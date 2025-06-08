import { execSync } from 'child_process';

try {
  console.log('Compiling billing agent module...');
  // Use the dedicated tsconfig file for billing agent
  execSync('npx tsc -p billing-agent-tsconfig.json', { stdio: 'inherit' });
  console.log('Compilation successful!');
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
