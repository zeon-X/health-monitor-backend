/**
 * Integration Test Setup
 * Global setup for integration tests
 */

// Set longer timeout for integration tests (database operations)
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
if (process.env.SILENT_TESTS === "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
