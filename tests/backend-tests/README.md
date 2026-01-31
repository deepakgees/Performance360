# Backend Tests

Automated unit and integration tests for the backend API and utilities.

## Overview

This test suite covers:
- **Logger functionality** - Log levels, filtering, user information
- **Database operations** - Connection, queries, transactions
- **API endpoints** - Authentication, data retrieval, error handling
- **Jira integration** - Ticket extraction, close date logic

## Prerequisites

1. **Generate Prisma Client:**
   ```bash
   cd backend
   npm run db:generate
   ```
   This generates the Prisma Client that the tests need.

2. **Build the backend:**
   ```bash
   cd backend
   npm run build
   ```

3. **Install test dependencies:**
   ```bash
   cd tests/backend-tests
   npm install
   ```
   This will automatically generate Prisma Client (via postinstall script).
   
   If Prisma generation fails, you can manually run:
   ```bash
   cd tests/backend-tests
   npm run setup
   ```
   Or directly:
   ```bash
   cd backend
   npm run db:generate
   ```

4. **Database setup:**
   - Database must be running and accessible
   - `.env` file in `backend/` must have correct `DATABASE_URL`

4. **For API tests (optional):**
   - Backend server running on `http://localhost:3001`
   - Test users created (for indirect-reports test)

## Running Tests

### Run All Tests
```bash
cd tests/backend-tests
npm test
```

### Run Specific Test Suite
```bash
# Logging tests only
npm run test:logging

# Database tests only
npm run test:database

# API tests only
npm run test:api
```

### Run Individual Test File
```bash
node test-runner.js --suite logging
node test-runner.js --suite database
node test-runner.js --suite api
```

## Test Suites

### Logging Tests

Tests the logger utility functionality.

**Files:**
- `test-logging.js` - Basic logging functionality
- `test-log-levels.js` - Log level filtering
- `test-auth-logging.js` - Authenticated user logging

**What they test:**
- All log levels (DEBUG, INFO, WARN, ERROR)
- Log file creation
- User information in logs
- API access logging
- Database operation logging
- Authentication logging

**Requirements:**
- Backend must be built (`npm run build` in `backend/`)
- Logs directory will be created automatically

---

### Database Tests

Tests database connectivity and queries.

**Files:**
- `test-database.js` - Database connection and basic queries
- `test-jira-close-date.js` - Jira ticket close date logic

**What they test:**
- Database connection
- Table existence and queryability
- JiraConfiguration table
- User table
- Transaction support
- Jira ticket endDate logic
- Active Jira configurations

**Requirements:**
- Database must be running
- `.env` must have `DATABASE_URL`

---

### API Tests

Tests API endpoints (requires running server).

**Files:**
- `test-api-indirect-reports.js` - Indirect reports endpoint
- `test-api-jira-tickets.js` - Jira tickets endpoints

**What they test:**
- Authentication
- Endpoint accessibility
- Response format
- Data validation
- Error handling

**Requirements:**
- Backend server running on `http://localhost:3001`
- For indirect-reports: Test user with manager role
- For jira-tickets: Optional Jira credentials

**Environment Variables:**
```bash
# For indirect-reports test
BASE_URL=http://localhost:3001
TEST_USER_EMAIL=manager@company.com
TEST_USER_PASSWORD=manager123

# For jira-tickets test (optional)
JIRA_USERNAME=your-username
JIRA_PASSWORD=your-password
JIRA_SERVER=https://nexontis.atlassian.net
```

---

## Test Structure

Each test file exports a `run` function that accepts:
- `recordResult(testName, passed, message)` - Record test result
- `recordWarning(testName, message)` - Record warning

Example:
```javascript
async function run(recordResult, recordWarning) {
  try {
    // Test something
    recordResult('Test Name', true, 'Success message');
  } catch (error) {
    recordResult('Test Name', false, `Error: ${error.message}`);
  }
}

module.exports = { run };
```

## Test Output

Tests output:
- ✓ **Passed tests** - Green, with success message
- ✗ **Failed tests** - Red, with error message
- ⚠ **Warnings** - Yellow, with warning message

At the end, a summary is displayed:
```
=== Test Summary ===
Total Tests: 15
Passed: 14
Failed: 1
Warnings: 2
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```bash
# In CI/CD script
cd backend && npm run build
cd ../tests/backend-tests && npm install && npm test
```

Exit codes:
- `0` - All tests passed
- `1` - One or more tests failed

## Troubleshooting

### "Logger not available"
- Run `npm run build` in the `backend/` directory first

### "Cannot connect to database"
- Check database is running
- Verify `DATABASE_URL` in `.env` file

### "Cannot connect to backend server"
- Start the backend server: `cd backend && npm run dev`
- Or set `BASE_URL` environment variable

### "Authentication failed"
- Create test users using seed script: `npm run db:seed`
- Or set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` environment variables

## Related Documentation

- [Test Utilities](../../backend/scripts/test-utilities/README.md) - Manual testing utilities
- [Main Tests README](../README.md) - Overview of all test suites
- [Backend Scripts](../../backend/scripts/README.md) - Other backend utilities
