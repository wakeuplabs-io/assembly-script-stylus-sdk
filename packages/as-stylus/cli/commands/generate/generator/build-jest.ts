import fs from "fs";
import path from "path";

export function buildJestConfig(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "jest.config.js"),
    `
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  globalSetup: "<rootDir>/globalSetup.ts",
  globalTeardown: "<rootDir>/globalTeardown.ts",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)\\.js$": "<rootDir>/$1",
    "^@wakeuplabs/as-stylus$": "<rootDir>/node_modules/@wakeuplabs/as-stylus/index.ts",
    "^@wakeuplabs/as-stylus/(.*)\\.js$":
      "<rootDir>/node_modules/@wakeuplabs/as-stylus/$1.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(strip-ansi|ansi-regex|@wakeuplabs/as-stylus)/)",
  ],
  testMatch: ["**/tests/**/*.test.ts"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["tests/**/*.ts", "!**/node_modules/**", "!**/dist/**"],
};`,
  );
}
