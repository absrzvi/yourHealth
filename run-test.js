const { exec } = require('child_process');
const fs = require('fs');

// Configuration
const testFile = 'lib/claims/eligibility/__tests__/default.parser.test.ts';
const testName = 'should parse a complete eligibility response';
const outputFile = 'test-output-clean.txt';

console.log(`Running test: ${testName} from ${testFile}`);

// Run the test with minimal output
const command = `npx jest ${testFile} -t "${testName}" --config=jest.eligibility.config.js --no-cache --silent`;

console.log('Executing test...');

const child = exec(command, (error, stdout, stderr) => {
  const output = `=== Test Output ===\n${stdout}\n=== Errors ===\n${stderr}`;
  fs.writeFileSync(outputFile, output);
  console.log(`Test completed. Results saved to ${outputFile}`);
  
  if (error) {
    console.error('Test failed with error:', error.message);
  }
});

// Pipe output to console as well
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
