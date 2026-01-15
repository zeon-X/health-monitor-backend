/**
 * Jest Configuration
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!src/config/**"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  // Separate test configurations
  projects: [
    {
      displayName: "unit",
      testMatch: ["**/tests/**/*.test.js", "!**/tests/integration/**"],
      testEnvironment: "node",
    },
    {
      displayName: "integration",
      testMatch: ["**/tests/integration/**/*.test.js"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.js"],
    },
  ],
  verbose: true,
};
