#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Running Billing Agent Tests...');

// Run Jest with the specific config file for billing agent tests
const jestProcess = spawn('npx', [
  'jest',
  '--config=lib/billing-agent/jest.config.mjs',
  '--no-cache',
  '--runInBand',
  '--verbose'
], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-vm-modules'
  }
});

jestProcess.on('close', (code) => {
  console.log(`Jest process exited with code ${code}`);
  process.exit(code);
});
