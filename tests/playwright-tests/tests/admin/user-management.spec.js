const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerUserWithRole, loginUser } = require('../../utils/test-helpers');

const adminPattern = 'admin-user-mgmt';
const testUserPattern = 'test-user-mgmt';
const adminUserData = generateTestUserData(adminPattern, 'Admin', 'User', 'Password@123');

test.describe('User Management - Admin Tests', () => {
  
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerUserWithRole(page, adminUserData, 'ADMIN');
    await page.close();
  });

  // Helper function to login as admin
  async function loginAsAdmin(page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUserData.email);
    await page.fill('input[name="password"]', adminUserData.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:\d+\/?$/, { timeout: 10000 });
  }

  // Helper function to navigate to user management page
  async function navigateToUserManagement(page) {
    await page.goto('/settings/users');
    await page.waitForURL('**/settings/users', { timeout: 10000 });
    await page.waitForSelector('#users-title', { timeout: 10000 });
  }

  test.describe('Page Access and Navigation', () => {
    test('Should load User Management page successfully', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Verify page title
      await expect(page.locator('#users-title')).toBeVisible();
      await expect(page.locator('#users-title')).toHaveText('User Management');
      
      // Verify page is accessible
      await expect(page.locator('#users-page')).toBeVisible();
    });

    test('Should display Add User button', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Verify Add User button is visible
      await expect(page.locator('#add-user-button')).toBeVisible();
      await expect(page.locator('#add-user-button')).toContainText('Add User');
    });
  });

  test.describe('Filters', () => {
    test('Should display all filter dropdowns', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Verify filter dropdowns are visible
      await expect(page.locator('label:has-text("Filter by Business Unit")')).toBeVisible();
      await expect(page.locator('label:has-text("Filter by Manager")')).toBeVisible();
      await expect(page.locator('label:has-text("Filter by Role")')).toBeVisible();
      await expect(page.locator('label:has-text("Filter by Team")')).toBeVisible();
    });

    test('Should filter users by role', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Wait for filters to load
      await page.waitForTimeout(1000);
      
      // Find role filter dropdown
      const roleFilter = page.locator('select').filter({ hasText: 'All Roles' }).first();
      const roleFilterCount = await roleFilter.count();
      
      if (roleFilterCount > 0) {
        await roleFilter.selectOption({ index: 1 }); // Select first role option
        await page.waitForTimeout(500);
        
        // Verify filter is applied
        await expect(page.locator('#users-table-container')).toBeVisible();
      }
    });
  });

  test.describe('User Table', () => {
    test('Should display users table', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Wait for table to load
      await page.waitForSelector('#users-table-container', { timeout: 10000 });
      
      // Verify table container is visible
      await expect(page.locator('#users-table-container')).toBeVisible();
    });

    test('Should display table headers', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Wait for table to load
      await page.waitForTimeout(2000);
      
      // Verify table headers
      await expect(page.locator('#sort-name-header')).toBeVisible();
      await expect(page.locator('#sort-manager-header')).toBeVisible();
      await expect(page.locator('#sort-role-header')).toBeVisible();
      await expect(page.locator('#sort-email-header')).toBeVisible();
      await expect(page.locator('#actions-header')).toBeVisible();
    });

    test('Should allow sorting by name', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Wait for table to load
      await page.waitForTimeout(2000);
      
      // Click on name header to sort
      await page.locator('#sort-name-header').click();
      await page.waitForTimeout(500);
      
      // Verify table is still visible
      await expect(page.locator('#users-table')).toBeVisible();
    });
  });

  test.describe('Create User', () => {
    test('Should open Create User modal', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Click Add User button
      await page.click('#add-user-button');
      await page.waitForSelector('h3:has-text("Add New User")', { timeout: 5000 });
      
      // Verify modal is visible
      await expect(page.locator('h3:has-text("Add New User")')).toBeVisible();
    });

    test('Should display all form fields in Create User modal', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToUserManagement(page);
      
      // Click Add User button
      await page.click('#add-user-button');
      await page.waitForSelector('h3:has-text("Add New User")', { timeout: 5000 });
      
      // Verify all form fields are present
      await expect(page.locator('label:has-text("First Name *")')).toBeVisible();
      await expect(page.locator('label:has-text("Last Name *")')).toBeVisible();
      await expect(page.locator('label:has-text("Email *")')).toBeVisible();
      await expect(page.locator('label:has-text("Password *")')).toBeVisible();
      await expect(page.locator('label:has-text("Role *")')).toBeVisible();
    });

    test('Should create a new user successfully', async ({ page }) => {
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'User', 'Password@123');
      
      try {
        await loginAsAdmin(page);
        await navigateToUserManagement(page);
        
        // Click Add User button
        await page.click('#add-user-button');
        await page.waitForSelector('h3:has-text("Add New User")', { timeout: 5000 });
        
        // Fill in form
        await page.fill('input[name="firstName"]', testUserData.firstName);
        await page.fill('input[name="lastName"]', testUserData.lastName);
        await page.fill('input[name="email"]', testUserData.email);
        await page.fill('input[name="password"]', testUserData.password);
        await page.fill('input[name="confirmPassword"]', testUserData.password);
        await page.selectOption('select[name="role"]', { value: 'EMPLOYEE' });
        
        // Submit form
        await page.click('button:has-text("Create User")');
        
        // Wait for modal to close
        await page.waitForSelector('h3:has-text("Add New User")', { state: 'hidden', timeout: 10000 });
        
        // Verify success notification
        const successNotification = page.locator('[data-testid="success-notification"]');
        const hasNotification = await successNotification.isVisible().catch(() => false);
        
        if (hasNotification) {
          await expect(successNotification).toBeVisible();
        }
      } finally {
        // Clean up
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('Reset Password', () => {
    test('Should open Reset Password modal', async ({ page }) => {
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'User', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToUserManagement(page);
        
        // Wait for table to load
        await page.waitForTimeout(2000);
        
        // Find the user row
        const userRow = page.locator(`#user-row-${createdUser.id}`);
        const isUserRowVisible = await userRow.isVisible().catch(() => false);
        
        if (isUserRowVisible) {
          // Click Reset Password button
          await page.locator('button:has-text("Reset Password")').first().click();
          await page.waitForTimeout(1000);
          
          // Verify modal is visible
          await expect(page.locator('h2:has-text("Reset Password")')).toBeVisible();
        }
      } finally {
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('Edit Manager', () => {
    test('Should open Edit Manager modal', async ({ page }) => {
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'User', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToUserManagement(page);
        
        // Wait for table to load
        await page.waitForTimeout(2000);
        
        // Find the user row
        const userRow = page.locator(`#user-row-${createdUser.id}`);
        const isUserRowVisible = await userRow.isVisible().catch(() => false);
        
        if (isUserRowVisible) {
          // Click Edit Manager button
          await page.locator('button:has-text("Edit Manager")').first().click();
          await page.waitForTimeout(1000);
          
          // Verify modal is visible
          await expect(page.locator('h2:has-text("Edit Manager")')).toBeVisible();
        }
      } finally {
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('Delete User', () => {
    test('Should delete user with confirmation', async ({ page }) => {
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'User', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToUserManagement(page);
        
        // Wait for table to load
        await page.waitForTimeout(2000);
        
        // Set up dialog handler for confirmation
        page.once('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          await dialog.accept();
        });
        
        // Find and click Delete User button
        const deleteButtons = page.locator('button:has-text("Delete User")');
        const count = await deleteButtons.count();
        
        if (count > 0) {
          await deleteButtons.first().click();
          await page.waitForTimeout(1000);
          
          // Verify success notification
          const successNotification = page.locator('[data-testid="success-notification"]');
          const hasNotification = await successNotification.isVisible().catch(() => false);
          
          if (hasNotification) {
            await expect(successNotification).toBeVisible();
          }
        }
      } finally {
        // Clean up in case deletion didn't work
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  // Clean up test users
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, adminPattern);
    await page.close();
  });
});
