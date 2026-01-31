# Admin Tests

This directory contains tests for features available **only to Admin role**.

## Test Files

Currently, there are no admin-specific tests. This directory is reserved for future tests of admin-only features.

## Admin-Only Features

The following features are available only to admins:

- **User Management** - Create, update, and delete users
- **Role Management** - Assign roles to users
- **Manager Assignment** - Assign managers to employees
- **System Configuration** - Configure system settings
- **Access to All Data** - View data for all users regardless of hierarchy
- **User Password Reset** - Reset passwords for any user

## Adding Admin Tests

When creating tests for admin-only features:

1. Create test files in this directory with `.spec.js` extension
2. Use the `registerUserWithRole` helper with `'ADMIN'` role
3. Test that employees and managers cannot access these features
4. Test that only admins can access these features

## Running Admin Tests

```bash
# Run all admin tests
npx playwright test --project=admin

# Run a specific test file
npx playwright test tests/admin/user-management.spec.js
```

## Example Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { registerUserWithRole, loginUser } = require('../../utils/test-helpers');

test.describe('Admin Features', () => {
  test('Admin can manage users', async ({ page }) => {
    // Register and login as admin
    const admin = await registerUserWithRole(page, adminData, 'ADMIN');
    await loginUser(page, admin.email, admin.password);
    
    // Navigate to user management page
    await page.goto('/users');
    
    // Verify admin can see the page
    await expect(page.locator('h1')).toContainText('User Management');
  });
  
  test('Employee cannot access admin features', async ({ page }) => {
    // Register and login as employee
    const employee = await registerUserWithRole(page, employeeData, 'EMPLOYEE');
    await loginUser(page, employee.email, employee.password);
    
    // Try to access admin page
    await page.goto('/users');
    
    // Verify redirect or access denied
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
```

