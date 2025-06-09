#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Running Billing Agent Tests with Debug Output...');

// Run Jest with explicit output capture
const jestProcess = spawn('npx', [
  'jest',
  'lib/billing-agent/__tests__/SimplifiedBillingAgent.test.ts',
  '--no-cache',
  '--verbose',
  '--detectOpenHandles'
], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Capture and log stdout
jestProcess.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data.toString()}`);
});

// Capture and log stderr
jestProcess.stderr.on('data', (data) => {
  console.error(`STDERR: ${data.toString()}`);
});

jestProcess.on('close', (code) => {
  console.log(`Jest process exited with code ${code}`);
  process.exit(code);
});
