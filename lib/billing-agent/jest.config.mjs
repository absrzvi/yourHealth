import { defaults } from 'jest-config';

export default {
  // Use the project's Jest configuration as a base
  ...defaults,
  
  // Set up the test environment
  testEnvironment: 'node',
  
  // Use our custom setup file
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.mjs'],
  
  // Only run tests in the billing agent directory
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest']
  },
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../$1'
  },
  
  // Coverage settings
  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/__tests__/**'
  ],
  
  // Ignore node_modules
  transformIgnorePatterns: ['/node_modules/'],
  
  // Verbose output for debugging
  verbose: true
};
