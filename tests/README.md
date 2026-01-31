# Tests

This directory contains all test suites for the Employee Feedback Application.

## Test Suites

### [Playwright Tests](./playwright-tests/)
End-to-end (E2E) tests using Playwright for testing the full application flow.

**Quick Start:**
```bash
cd tests/playwright-tests
npm install
npm run install-browsers
npm test
```

See [playwright-tests/README.md](./playwright-tests/README.md) for detailed documentation.

### [Security Tests](./security-tests/)
Automated security testing suite to verify access controls and data privacy.

**Quick Start:**
```bash
cd tests/security-tests
npm install
node security-test-suite.js
```

See [security-tests/README.md](./security-tests/README.md) for detailed documentation.

### [Backend Tests](./backend-tests/)
Backend unit and integration tests for API endpoints, database operations, and utilities.

**Quick Start:**
```bash
# Build backend first
cd backend
npm run build

# Run tests
cd ../tests/backend-tests
npm install
npm test
```

See [backend-tests/README.md](./backend-tests/README.md) for detailed documentation.

## Running All Tests

### Playwright E2E Tests
```bash
cd tests/playwright-tests
npm test
```

### Security Tests
```bash
cd tests/security-tests
node security-test-suite.js
```

### Backend Tests
```bash
cd backend && npm run build
cd ../tests/backend-tests && npm install && npm test
```

## CI/CD Integration

All test suites are designed to work in CI/CD environments:
- Playwright tests support headless mode and parallel execution
- Security tests generate JSON reports for automated analysis
- Backend tests can run independently and provide exit codes for CI/CD pipelines

