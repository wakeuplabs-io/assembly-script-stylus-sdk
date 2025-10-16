/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/tests/(.*)\\.js$": "<rootDir>/__tests__/$1",
    "^@/(.*)\\.js$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts", "**/__tests__/**/*.test.ts"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["cli/**/*.ts", "core/**/*.ts", "!**/node_modules/**", "!**/dist/**"],
};
