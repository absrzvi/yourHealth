// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to global scope
// @ts-ignore - These are Node.js globals
global.TextEncoder = TextEncoder;
// @ts-ignore - These are Node.js globals
global.TextDecoder = TextDecoder;

// Mock matchMedia for tests - check environment first
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
} else {
  // In Node environment, create a global.window mock
  (global as any).window = {
    matchMedia: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  };
}

// Mock any other browser APIs that might be needed
if (typeof URL !== 'undefined') {
  // In browser/jsdom environment
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = jest.fn();
  }
  if (!global.URL.revokeObjectURL) {
    global.URL.revokeObjectURL = jest.fn();
  }
} else {
  // In Node environment
  (global as any).URL = {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn()
  };
}

// Mock console methods to keep test output clean
const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'];

beforeEach(() => {
  consoleMethods.forEach(method => {
    // @ts-ignore
    jest.spyOn(console, method).mockImplementation(() => {});
  });
});

afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});
