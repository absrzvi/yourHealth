module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/lib/claims/eligibility/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup-eligibility.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage/eligibility',
  collectCoverageFrom: [
    'lib/claims/eligibility/**/*.ts',
    '!lib/claims/eligibility/**/*.d.ts',
    '!lib/claims/eligibility/**/*.test.ts',
  ],
};
