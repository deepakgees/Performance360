# Playwright E2E Tests for Performance360

This directory contains end-to-end tests for the Performance360 application using Playwright.

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- The frontend application running on `http://localhost:3000`
- The backend API running on `http://localhost:5000`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install-browsers
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests by role
```bash
# Run employee tests (features available to all roles)
npm run test:employee

# Run manager tests (manager-only features)
npm run test:manager

# Run admin tests (admin-only features)
npm run test:admin

# Run all tests across all roles
npm run test:all
```

### Run smoke tests (critical functionality only - faster)
```bash
npm run test:smoke
```

### Run smoke tests in headed mode
```bash
npm run test:smoke:headed
```

### Run feedback smoke tests
```bash
npm run test:feedback:smoke
```

### Run feedback smoke tests in headed mode
```bash
npm run test:feedback:smoke:headed
```

### Run all spec files (excluding smoke tests)
```bash
npm run test:all
```

### Run all smoke test files
```bash
npm run test:smoke
```

### Run all tests in headed mode (with browser visible)
```bash
npm run test:all:headed
```

### Run all tests with Playwright UI
```bash
npm run test:all:ui
```

### Run all tests in debug mode
```bash
npm run test:all:debug
```

### Run tests in headed mode (with browser visible)
```bash
npm run test:headed
```

### Run tests with Playwright UI
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### View test report
```bash
npm run report
```

## Test Structure

Tests are organized by role in subdirectories:

### Employee Tests (`tests/employee/`)
Features available to all roles (Employee, Manager, Admin):
- `user-registration-login.spec.js` - User registration and login flow tests
- `self-assessment.spec.js` - Self-assessment functionality tests
- `create-assessment-current-quarter.spec.js` - Current quarter assessment tests
- `colleague-feedback.spec.js` - Colleague feedback submission tests
- `manager-feedback.spec.js` - Manager feedback submission tests

### Manager Tests (`tests/manager/`)
Features available only to Manager and Admin roles:
- Currently no tests (reserved for future manager-specific features)

### Admin Tests (`tests/admin/`)
Features available only to Admin role:
- Currently no tests (reserved for future admin-specific features)

## Test Utilities

Common helper functions are available in `utils/test-helpers.js` to avoid code duplication:

### Available Functions

- `deleteUser(page, email)` - Delete a user by email via API
- `deleteUsersByPattern(page, emailPattern)` - Delete users matching an email pattern
- `generateTestEmail(prefix)` - Generate unique test email with timestamp
- `generateTestUserData(prefix, firstName, lastName, password)` - Generate complete test user data
- `cleanupTestUsers(page, patterns)` - Clean up multiple test user patterns
- `loginUser(page, email, password)` - Helper for user login
- `registerUser(page, userData)` - Helper for user registration via API
- `registerUserViaUI(page, userData)` - Helper for user registration via UI (legacy)
- `registerUserWithRole(page, userData, role)` - Create user with specific role via API
- `createAndLoginUserWithRole(page, prefix, role, options)` - Create user with role and login
- `waitForElement(page, selector, timeout)` - Wait for element with timeout
- `takeScreenshotOnFailure(page, testName)` - Take screenshot on test failure

### Usage Example

```javascript
const { test, expect } = require('@playwright/test');
const { generateTestUserData, deleteUser, registerUser, registerUserViaUI, createAndLoginUserWithRole } = require('../utils/test-helpers');

test('API registration test', async ({ page }) => {
  const testUser = generateTestUserData('testuser', 'John', 'Doe', 'Password@123');
  
  // Register user via API (faster, more reliable)
  const createdUser = await registerUser(page, testUser);
  console.log('User created with ID:', createdUser.id);
  
  // Clean up after test
  await deleteUser(page, testUser.email);
});

test('UI registration test', async ({ page }) => {
  const testUser = generateTestUserData('testuser', 'Jane', 'Smith', 'Password@123');
  
  // Register user via UI (tests the actual registration flow)
  const email = await registerUserViaUI(page, testUser);
  console.log('User registered via UI:', email);
  
  // Clean up after test
  await deleteUser(page, testUser.email);
});

test('manager role test', async ({ page }) => {
  // Create and login as a manager
  const { userData, createdUser } = await createAndLoginUserWithRole(
    page, 
    'manager', 
    'MANAGER', 
    { firstName: 'Jane', lastName: 'Manager' }
  );
  
  // Test manager-specific functionality
  await expect(page.locator('text=Manager Dashboard')).toBeVisible();
  
  // Clean up after test
  await deleteUser(page, userData.email);
});
```

## Configuration

The tests are configured in `playwright.config.js` with the following features:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari, and mobile viewports
- **Smoke Tests**: Fast execution with single worker and no retries
- **Screenshots**: Taken on test failure
- **Videos**: Recorded on test failure
- **Traces**: Collected on first retry
- **Web Server**: Automatically starts the frontend dev server

### Smoke Tests vs Full Test Suite

- **Smoke Tests** (`--project=smoke`): 
  - ⚡ Fast execution (1-2 minutes)
  - 🎯 Critical functionality only
  - 🔧 Single worker, no retries
  - 📋 Perfect for pre-commit hooks and quick validation

- **Full Test Suite** (default):
  - 🧪 Comprehensive test coverage
  - 🔄 Parallel execution with retries
  - 📊 Full browser compatibility testing
  - ⏱️ Longer execution time (5-10 minutes)

## Test Data

The tests use dynamic test data with timestamps to ensure uniqueness:
- Email addresses: `testuser${timestamp}@example.com`
- Passwords: `Password@123`
- Names: `John Doe`, `Jane Smith`

## Writing New Tests

1. Create a new test file in the `tests/` directory
2. Use the `test.describe()` and `test()` functions from Playwright
3. Follow the existing patterns for login setup and assertions
4. Use `page.locator()` for element selection
5. Use `expect()` for assertions

### Example Test Structure:
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code (login, navigation, etc.)
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests failing due to missing elements
- Check that the frontend application is running
- Verify that the element selectors match the actual HTML
- Use Playwright's inspector to debug: `npx playwright test --debug`

### Browser issues
- Reinstall browsers: `npm run install-browsers`
- Clear browser cache and cookies
- Check browser compatibility

### Performance issues
- Run tests in parallel: `npx playwright test --workers=4`
- Use specific browsers: `npx playwright test --project=chromium`

## CI/CD Integration

The tests are configured for CI environments:
- Retries: 2 attempts on CI
- Single worker on CI
- Forbid-only mode enabled on CI
- HTML reporter for test results

## Migration from Cypress

These tests replace the previous Cypress tests with equivalent Playwright functionality:

| Cypress | Playwright |
|---------|------------|
| `cy.visit()` | `page.goto()` |
| `cy.get()` | `page.locator()` |
| `cy.click()` | `page.click()` |
| `cy.type()` | `page.fill()` |
| `cy.should()` | `expect()` |
| `cy.url()` | `page.url()` |
| `cy.on('window:alert')` | `page.on('dialog')` | 