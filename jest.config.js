const nextJest = require('next/jest');

// Force SWC to be available for tests
process.env.NEXT_DISABLE_SWC = '0';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // Test files should be in __tests__ folders or end with .test.ts(x) or .spec.ts(x)
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/test/**/*.test.ts' // Include our test directory
  ],
  setupFiles: [
    '<rootDir>/jest.polyfills.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/__tests__/setup.ts',
  ],
  testEnvironment: 'jsdom', // Changed from node to jsdom to support window object in tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.ts',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.ts',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/setup.ts',
  ],
  // Handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@panva/hkdf|@panva/oidc-provider-adapter|@panva/oidc-provider-db-adapter|@panva/oidc-provider|@panva/oidc-provider/|@panva/oidc-provider/.*|@panva/oidc-provider-db-adapter/.*|@panva/oidc-provider-adapter/.*|@panva/hkdf/.*)/)',
  ],
  transform: {
    // Use swc for faster transpilation
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          jsx: true,
          dynamicImport: true,
          modules: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@next/swc|@swc|next)/)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  // Increase test timeout
  testTimeout: 10000,
  // Clear mock calls and instances between tests
  clearMocks: true,
  // Collect coverage from these files
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  // setupFiles: ['<rootDir>/jest.setup.js'], // Removed to prevent double-loading and ReferenceError

};

module.exports = createJestConfig(customJestConfig);
