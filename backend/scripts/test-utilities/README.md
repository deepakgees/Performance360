# Test Utilities

This directory contains utility scripts for manual testing, debugging, and demonstration purposes during development.

## Overview

These scripts are **not automated tests** but rather development utilities that can be run manually to:
- Check database state
- Test specific functionality
- Demonstrate logging behavior
- Debug issues

For automated tests, see the [`tests/backend-tests/`](../../tests/backend-tests/) directory.

## Utilities

### `check-users.js`

Lists all users in the database with their basic information.

**Usage:**
```bash
node scripts/test-utilities/check-users.js
```

**Output:**
- Lists all users with email, name, role, and active status
- Sorted by email address

---

### `test-jira-auth.js`

Tests Jira API authentication and ticket extraction.

**Usage:**
```bash
# Set credentials via environment variables
JIRA_USERNAME=your-username JIRA_PASSWORD=your-password node scripts/test-utilities/test-jira-auth.js

# Or add to .env file:
# JIRA_USERNAME=your-username
# JIRA_PASSWORD=your-password
```

**Configuration:**
- `JIRA_USERNAME` - Your Jira username
- `JIRA_PASSWORD` - Your Jira password/token
- `JIRA_SERVER` - Jira server URL (default: https://nexontis.atlassian.net)
- `BASE_URL` - Backend API URL (default: http://localhost:3001/api)

---

### `demo-logging-levels.js`

Demonstrates how different log levels work and filter messages.

**Usage:**
```bash
# Test with different log levels
LOG_LEVEL=ERROR node scripts/test-utilities/demo-logging-levels.js
LOG_LEVEL=WARN node scripts/test-utilities/demo-logging-levels.js
LOG_LEVEL=INFO node scripts/test-utilities/demo-logging-levels.js
LOG_LEVEL=DEBUG node scripts/test-utilities/demo-logging-levels.js
LOG_LEVEL=TRACE node scripts/test-utilities/demo-logging-levels.js
```

**What it demonstrates:**
- How log levels filter messages
- API request/response logging
- Database operation logging
- Authentication event logging
- Authorization event logging

---

### `demo-middleware-logging.js`

Demonstrates the middleware order and how user information is logged.

**Usage:**
```bash
# Make sure backend is built first
cd backend
npm run build
node scripts/test-utilities/demo-middleware-logging.js
```

**What it demonstrates:**
- Middleware execution order (requestLogger → authenticateToken → responseLogger)
- Anonymous vs authenticated request logging
- User information in logs

---

### `demo-final-logging.js`

Demonstrates the corrected middleware order and user information logging.

**Usage:**
```bash
# Make sure backend is built first
cd backend
npm run build
node scripts/test-utilities/demo-final-logging.js
```

**What it demonstrates:**
- Corrected middleware order
- User information in all log entries
- Multiple API endpoint logging

---

## Prerequisites

### For Database Utilities
- Database must be running and accessible
- `.env` file must have correct `DATABASE_URL`

### For Logging Utilities
- Backend must be built: `npm run build` in `backend/` directory
- Logs directory will be created automatically at `backend/logs/`

### For Jira Utilities
- Backend server must be running
- Jira credentials must be configured

## Notes

- These utilities are for **development use only**
- They are **not part of the automated test suite**
- They may modify database state (read-only operations are safe)
- Always use test/development databases, never production

## Related Documentation

- [Backend Tests](../../tests/backend-tests/README.md) - Automated backend tests
- [Backend Scripts](../README.md) - Other backend utility scripts
- [Main Tests README](../../tests/README.md) - Overview of all test suites
