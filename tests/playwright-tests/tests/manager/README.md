# Manager Tests

This directory contains tests for features available **only to Manager and Admin roles**.

## Test Files

Currently, there are no manager-specific tests. This directory is reserved for future tests of manager-only features.

## Manager-Only Features

The following features are available only to managers (and admins):

- **Direct Reports** - View and manage direct reports
- **Indirect Reports** - View and manage indirect reports
- **Team Management** - Manage team members
- **Performance Reviews** - Review employee performance
- **Access to Reports' Data** - View data for direct and indirect reports

## Adding Manager Tests

When creating tests for manager-only features:

1. Create test files in this directory with `.spec.js` extension
2. Use the `registerUserWithRole` helper with `'MANAGER'` role
3. Test that employees cannot access these features
4. Test that managers and admins can access these features

## Running Manager Tests

```bash
# Run all manager tests
npx playwright test --project=manager

# Run a specific test file
npx playwright test tests/manager/direct-reports.spec.js
```

## Example Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { registerUserWithRole, loginUser } = require('../../utils/test-helpers');

test.describe('Manager Features', () => {
  test('Manager can view direct reports', async ({ page }) => {
    // Register and login as manager
    const manager = await registerUserWithRole(page, managerData, 'MANAGER');
    await loginUser(page, manager.email, manager.password);
    
    // Navigate to direct reports page
    await page.goto('/direct-reports');
    
    // Verify manager can see the page
    await expect(page.locator('h1')).toContainText('Direct Reports');
  });
});
```

