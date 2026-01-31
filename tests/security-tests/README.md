# Security Testing Suite

This directory contains automated security tests for the Employee Feedback Application.

## Overview

The security test suite tests for:
- **IDOR (Insecure Direct Object Reference)** vulnerabilities
- **Authorization bypass** attempts
- **Authentication bypass** attempts
- **Role-based access control** enforcement
- **Input validation** (SQL injection, XSS)
- **Missing authentication** on state-changing operations
- **Token manipulation** attempts
- **Rate limiting** (if implemented)

## Prerequisites

1. **Backend server running**
   ```bash
   cd backend
   npm start
   ```

2. **Install dependencies**
   ```bash
   npm install axios colors
   ```

3. **Create test users** (employee, manager, admin) in your database

4. **Get authentication tokens** for each role:
   ```bash
   # Login as employee
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"employee@example.com","password":"password"}'
   
   # Login as manager
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"manager@example.com","password":"password"}'
   
   # Login as admin
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'
   ```

## Running Tests

### Option 1: Using Environment Variables

```bash
export EMPLOYEE_TOKEN="your_employee_token_here"
export MANAGER_TOKEN="your_manager_token_here"
export ADMIN_TOKEN="your_admin_token_here"
export BASE_URL="http://localhost:3001"

node tests/security-tests/security-test-suite.js
```

### Option 2: Direct Token Input

Edit `security-test-suite.js` and set the tokens directly:

```javascript
const EMPLOYEE_TOKEN = 'your_employee_token_here';
const MANAGER_TOKEN = 'your_manager_token_here';
const ADMIN_TOKEN = 'your_admin_token_here';
```

### Option 3: Using a Test Script

Create a script `run-security-tests.sh`:

```bash
#!/bin/bash

# Get tokens by logging in
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@example.com","password":"password"}' | jq -r '.token')

MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"password"}' | jq -r '.token')

ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.token')

# Run tests
export EMPLOYEE_TOKEN
export MANAGER_TOKEN
export ADMIN_TOKEN
export BASE_URL="http://localhost:3001"

node tests/security-tests/security-test-suite.js
```

## Test Categories

### 1. Authentication Bypass Tests
Tests if protected endpoints can be accessed without authentication tokens.

### 2. Employee IDOR Tests
Tests if employees can access other employees' data by manipulating user IDs.

### 3. Manager IDOR Tests
Tests if managers can access data for users outside their management hierarchy.

### 4. Role-Based Access Control Tests
Tests if role-based restrictions are properly enforced (e.g., employees cannot access admin endpoints).

### 5. Input Validation Tests
Tests for SQL injection and XSS vulnerabilities.

### 6. State-Changing Operations Tests
Tests if POST/PUT/DELETE operations require authentication.

### 7. Token Manipulation Tests
Tests if invalid or manipulated tokens are properly rejected.

### 8. Rate Limiting Tests
Tests if rate limiting is implemented on authentication endpoints.

## Output

The test suite generates:
1. **Console output** with colored results
2. **JSON report** saved to `tests/security-tests/test-report.json`

### Exit Codes
- `0`: All tests passed
- `1`: Critical vulnerabilities found
- `2`: Failed tests (non-critical)

## Interpreting Results

- **✓ PASSED**: Test passed - security control is working
- **✗ CRITICAL FAILURE**: Critical vulnerability found - must fix immediately
- **✗ FAILED**: Security issue found - should be fixed
- **⚠ WARNING**: Potential issue or test limitation

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: |
          # Start backend server
          cd backend && npm start &
          sleep 10
      - run: |
          # Run security tests
          export EMPLOYEE_TOKEN="..."
          export MANAGER_TOKEN="..."
          export ADMIN_TOKEN="..."
          node tests/security-tests/security-test-suite.js
```

## Manual Testing Checklist

In addition to automated tests, manually verify:

- [ ] Employees cannot see other employees' data
- [ ] Managers can only see their direct/indirect reports
- [ ] Admins can see all data
- [ ] All POST/PUT/DELETE endpoints require authentication
- [ ] Invalid tokens are rejected
- [ ] Rate limiting works on login endpoint
- [ ] SQL injection attempts are blocked
- [ ] XSS payloads are sanitized or rejected

## Troubleshooting

### "Cannot get employee info - skipping IDOR tests"
- Ensure the employee token is valid
- Check that the backend server is running
- Verify the BASE_URL is correct

### "Skipping tests - no token provided"
- Set the environment variables or edit the script directly
- Ensure tokens are valid (not expired)

### Tests timing out
- Check backend server is running and accessible
- Verify network connectivity
- Check firewall settings

## Contributing

When adding new endpoints, update the test suite to include:
1. Authentication bypass test
2. IDOR test (if applicable)
3. Role-based access test (if applicable)
4. Input validation test (if user input is accepted)

