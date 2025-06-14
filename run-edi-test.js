const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const testFile = '__tests__/ediGenerator.test.ts';
const outputFile = 'edi-test-output.txt';

console.log(`Running EDI generator tests...`);

// Run the test with verbose output and no cache
const command = `npx jest ${testFile} --verbose --runInBand --detectOpenHandles --forceExit --no-cache --silent=false`;

console.log('Running command:', command);

console.log('Executing tests...');

const child = exec(command, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  console.log(str);
  output += str;
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  console.error(str);
  errorOutput += str;
});

child.on('close', (code) => {
  const result = `=== Test Output ===\n${output}\n=== Errors ===\n${errorOutput}`;
  fs.writeFileSync(outputFile, result);
  console.log(`Tests completed with exit code ${code}. Results saved to ${outputFile}`);
  process.exit(code);
});
