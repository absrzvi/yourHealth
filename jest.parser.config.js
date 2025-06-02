module.exports = {
  // Run our test files
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/lib/parsers/__tests__/**/*.test.ts',
  ],
  
  // Use Node.js test environment
  testEnvironment: 'node',
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
    }],
  },
  
  // Don't transform node_modules except for specific packages that need it
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@?react|@?next)/)',
  ],
  
  // Module name mappings
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  
  // File extensions to include
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  
  // Setup files
  // setupFiles: ['<rootDir>/test/setupTests.ts'], // Moved to setupFilesAfterEnv
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: false,
  
  // Don't collect coverage by default
  collectCoverage: false,
  
  // Verbose output
  verbose: true,
  
  // Show test location
  testLocationInResults: true,
  
  // Test timeout (30 seconds)
  testTimeout: 30000
};
