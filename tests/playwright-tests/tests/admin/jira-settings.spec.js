const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerUserWithRole, loginUser } = require('../../utils/test-helpers');

const adminPattern = 'admin-jira';
const adminUserData = generateTestUserData(adminPattern, 'Admin', 'User', 'Password@123');

test.describe('Jira Settings - Admin Tests', () => {
  
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

  test.describe('Jira Settings Page', () => {
    test('Should load Jira Settings page successfully', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/settings/jira');
      await page.waitForURL('**/settings/jira', { timeout: 10000 });
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Verify page is accessible
      await expect(page).toHaveURL(/.*\/settings\/jira/);
    });
  });

  test.describe('Jira Unmapped Users Page', () => {
    test('Should load Jira Unmapped Users page successfully', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/settings/jira-unmapped-users');
      await page.waitForURL('**/settings/jira-unmapped-users', { timeout: 10000 });
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Verify page is accessible
      await expect(page).toHaveURL(/.*\/settings\/jira-unmapped-users/);
    });
  });

  // Clean up test users
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, adminPattern);
    await page.close();
  });
});
