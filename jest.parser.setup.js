// Minimal setup for parser tests

// Mock any global objects that might be needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add any other global mocks or polyfills needed for the parser tests

// Silence console output during tests
const originalConsole = { ...console };
const consoleMocks = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

beforeAll(() => {
  // Replace console methods with mocks
  Object.keys(consoleMocks).forEach((method) => {
    console[method] = consoleMocks[method];
  });
});

afterAll(() => {
  // Restore original console methods
  Object.keys(originalConsole).forEach((method) => {
    console[method] = originalConsole[method];
  });
});
