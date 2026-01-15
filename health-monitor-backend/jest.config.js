/**
 * Jest Configuration
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/services/anomalyDetector.js"],
  coverageThreshold: {
    "src/services/anomalyDetector.js": {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  verbose: true,
};
