/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/cli/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }]
  },
  testMatch: ['**/tests/**/*.test.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'cli/**/*.ts',
    'core/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ]
};