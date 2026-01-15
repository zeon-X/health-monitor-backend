# Testing & CI/CD Documentation

## Overview

Comprehensive testing strategy for the Health Monitor Backend with automated CI/CD pipeline using GitHub Actions.

## Test Coverage Summary

### Core Components Tested

1. **Anomaly Detection Engine** (Unit Tests)
2. **Vitals API Endpoints** (Integration Tests)
3. **Alerts & Dashboard APIs** (Integration Tests)

---

## Test Structure

```
tests/
├── fixtures/
│   └── testDatasets.js          # Comprehensive test data (normal, edge, corner cases)
├── integration/
│   ├── setup.js                 # Integration test setup
│   ├── vitals.integration.test.js
│   └── alerts-dashboard.integration.test.js
└── anomalyDetector.test.js      # Unit tests for core logic
```

---

## Test Dataset Categories

### 1. Normal Cases

Typical vitals within healthy ranges for different patient profiles:

- Elderly patients (70+)
- Middle-aged patients (40-60)
- Young adults (20-40)
- At rest scenarios
- Light activity scenarios

**Example:**

```javascript
{
  heartRate: 72,
  bloodPressure: "120/80",
  spo2: 98,
  bodyTemperature: 36.7,
  motionLevel: 0.4,
  fallRiskScore: 10
}
```

### 2. Edge Cases

Boundary values near clinical thresholds:

- Heart rate at lower boundary (51 bpm - just above bradycardia)
- Heart rate at upper boundary (119 bpm - just below tachycardia)
- SpO2 at lower boundary (91% - just above hypoxemia)
- Blood pressure at upper boundary (179/109 - pre-hypertensive)
- Temperature boundaries (35.5°C, 37.8°C)
- Fall risk boundary (79 - just below detection)

### 3. Corner Cases

Critical/abnormal values and complex scenarios:

- Severe bradycardia (35 bpm)
- Severe tachycardia (155 bpm)
- Critical hypoxemia (82% SpO2)
- Hypertensive crisis (195/115)
- High fever (39.5°C)
- Severe hypothermia (33.8°C)
- Fall detected (98 risk score)
- Multiple concurrent anomalies
- Extreme values (stress testing)
- Zero/maximum motion

### 4. Time-Series Scenarios

Trend detection testing:

- Declining SpO2 (98% → 90.8% over 10 readings)
- Increasing heart rate (65 → 121 bpm over 8 readings)
- Temperature spike (36.8°C → 39.3°C over 6 readings)
- Stable vitals (minimal variation)
- Erratic vitals (unstable patient)

### 5. Invalid Data

Error handling validation:

- Missing required fields
- Invalid data types
- Out of range values
- Null/undefined values
- Empty objects

---

## Test Statistics

### Unit Tests (anomalyDetector.test.js)

- **Total Tests:** 18
- **Categories:**
  - Critical Vitals Detection: 6 tests
  - Fall Detection: 2 tests
  - Statistical Anomalies (Z-Score): 2 tests
  - Behavioral Anomalies: 1 test
  - Anomaly Scoring: 3 tests
  - Anomaly History: 2 tests
  - Multiple Alerts: 1 test
  - Normal Vitals: 1 test

### Integration Tests - Vitals API

- **Total Tests:** 35+
- **Endpoints:**
  - `GET /api/vitals/:patientId/latest` (15 tests)
  - `GET /api/vitals/:patientId/history` (19 tests)
  - Cross-endpoint consistency (1 test)

### Integration Tests - Alerts & Dashboard

- **Total Tests:** 30+
- **Endpoints:**
  - `GET /api/alerts/history` (14 tests)
  - `GET /api/dashboard/summary` (16 tests)

**Grand Total:** 83+ comprehensive tests

---

## CI/CD Pipeline

### Pipeline Structure

The GitHub Actions workflow consists of 5 parallel/sequential jobs:

```
┌─────────┐
│  Lint   │ (ESLint code quality checks)
└────┬────┘
     ├──────┬─────────────┐
     │      │             │
┌────▼────┐ ┌─────────▼──────────┐
│  Unit   │ │  Integration Tests │
│  Tests  │ │  (with MongoDB)    │
└────┬────┘ └─────────┬──────────┘
     │               │
     └───────┬───────┘
             │
     ┌───────▼────────┐
     │ Test Summary   │
     │ & Coverage     │
     └───────┬────────┘
             │
     ┌───────▼────────┐
     │     Build      │
     └────────────────┘
```

### Job Details

#### 1. **Lint Job**

- Runs ESLint on all source and test files
- Enforces code style and quality standards
- Fast feedback on code quality issues

#### 2. **Unit Tests Job**

- Runs tests that don't require external dependencies
- Tests pure business logic (AnomalyDetector)
- Executes: `npm run test:unit`
- Coverage uploaded as artifact

#### 3. **Integration Tests Job**

- Starts MongoDB service container
- Tests API endpoints with real database
- Executes: `npm run test:integration`
- Coverage uploaded as artifact

#### 4. **Test Summary Job**

- Runs all tests together for complete coverage report
- Uploads coverage to Codecov
- Generates comprehensive coverage artifacts

#### 5. **Build Job**

- Validates application can build successfully
- Checks for Dockerfile presence
- Only runs if all tests pass

### Coverage Thresholds

```javascript
{
  branches: 70%,
  functions: 70%,
  lines: 70%,
  statements: 70%
}
```

---

## Running Tests Locally

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Linting

```bash
npm run lint
```

### Auto-fix Linting Issues

```bash
npm run lint:fix
```

---

## Test Environment Configuration

### Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/health-monitor-test
NODE_ENV=test
```

### Integration Test Setup

- Timeout: 30 seconds (for database operations)
- Database: Cleared before each test
- Isolation: Each test uses clean database state

---

## Code Quality Standards

### ESLint Rules

- **Indentation:** 2 spaces
- **Quotes:** Double quotes
- **Semicolons:** Required
- **Unused vars:** Warning (with \_ prefix ignore)
- **Console:** Allowed (for backend logging)
- **Const preference:** Enforced
- **Equality:** Strict (===)
- **Arrow spacing:** Enforced

---

## Test Coverage Goals

### Current Coverage Targets

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Excluded from Coverage

- `src/index.js` (server entry point)
- `src/config/` (configuration files)
- `tests/` (test files themselves)
- `node_modules/`

---

## Key Testing Principles Applied

### 1. **Isolation**

- Each test is independent
- Database cleared before each test
- No shared state between tests

### 2. **Clarity**

- Descriptive test names
- Clear arrange-act-assert structure
- Comprehensive assertions

### 3. **Coverage**

- Normal user scenarios
- Edge cases at boundaries
- Corner cases with extreme values
- Error handling paths
- Time-series and trends

### 4. **Realism**

- Real MongoDB database for integration tests
- Actual HTTP requests via supertest
- Real patient data fixtures

### 5. **Performance**

- Unit tests run fast (no I/O)
- Integration tests use service containers
- Parallel job execution in CI

---

## Continuous Improvement

### Future Enhancements

1. **E2E Tests:** Add Playwright/Cypress for full user flows
2. **Load Testing:** Add performance benchmarks
3. **Security Tests:** Add OWASP dependency checks
4. **Mutation Testing:** Add Stryker for test quality
5. **Visual Reports:** Add test report dashboard

### Monitoring

- Codecov tracks coverage trends
- GitHub Actions provides test result history
- Failed tests block PR merges

---

## Test Maintenance

### Adding New Tests

1. Use test fixtures from `tests/fixtures/testDatasets.js`
2. Follow existing test structure and naming
3. Include normal, edge, and corner cases
4. Update this documentation

### Updating Fixtures

- Keep realistic medical values
- Document threshold boundaries
- Include timestamp generation
- Maintain backward compatibility

---

## Commands Reference

| Command                    | Description                 |
| -------------------------- | --------------------------- |
| `npm test`                 | Run all tests with coverage |
| `npm run test:unit`        | Run only unit tests         |
| `npm run test:integration` | Run only integration tests  |
| `npm run test:watch`       | Run tests in watch mode     |
| `npm run lint`             | Check code quality          |
| `npm run lint:fix`         | Auto-fix linting issues     |

---

## Troubleshooting

### MongoDB Connection Issues

```bash
# Ensure MongoDB is running
docker run -d -p 27017:27017 mongo:5.0

# Or use local installation
mongod --dbpath /data/db
```

### Integration Tests Timeout

- Increase timeout in `tests/integration/setup.js`
- Check MongoDB service health
- Verify network connectivity

### Coverage Not Meeting Threshold

- Run `npm test` to see coverage report
- Check `coverage/lcov-report/index.html` for details
- Add tests for uncovered branches/functions

---

## Documentation

- **Architecture:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **API Reference:** [docs/QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md)
- **Database Schema:** [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)

---

**Last Updated:** January 15, 2026
**Test Count:** 83+ tests
**CI/CD Platform:** GitHub Actions
**Coverage Tool:** Jest + Codecov
