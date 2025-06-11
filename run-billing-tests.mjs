#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Running Billing Agent Tests...');

// Run Jest with the project's main configuration
const jestProcess = spawn('npx', [
  'jest',
  'lib/billing-agent/__tests__',
  '--testEnvironment=node',
  '--no-cache',
  '--detectOpenHandles',
  '--forceExit',
  '--verbose'
], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-vm-modules --no-warnings'
  }
});

jestProcess.on('close', (code) => {
  console.log(`Jest process exited with code ${code}`);
  process.exit(code);
});
