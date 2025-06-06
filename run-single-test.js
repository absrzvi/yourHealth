// Simple script to run a single test and log the output
const { exec } = require('child_process');
const fs = require('fs');

const testFile = 'lib/claims/eligibility/__tests__/default.parser.test.ts';
const testName = 'should parse a complete eligibility response';
const outputFile = 'test-output.txt';

console.log(`Running test: ${testName}`);
console.log(`Output will be saved to: ${outputFile}`);

const command = `npx jest ${testFile} -t "${testName}" --config=jest.eligibility.config.js --runInBand --no-cache --verbose`;

const child = exec(command, (error, stdout, stderr) => {
  const output = `=== Test Output ===\n${stdout}\n=== Errors ===\n${stderr}`;
  fs.writeFileSync(outputFile, output);
  console.log(`Test completed. Check ${outputFile} for results.`);
});

// Pipe output to console as well
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
