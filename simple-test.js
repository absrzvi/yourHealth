// Simple test file to verify test runner functionality

console.log('=== SIMPLE TEST STARTED ===');

// Simple test function
function add(a, b) {
  return a + b;
}

// Test case
const result = add(2, 3);
console.log('2 + 3 =', result);

// Assertion
if (result !== 5) {
  console.error('Test failed: Expected 2 + 3 to equal 5');
  process.exit(1);
}

console.log('=== TEST PASSED ===');
process.exit(0);
