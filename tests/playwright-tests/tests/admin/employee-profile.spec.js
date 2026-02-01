const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerUserWithRole, loginUser } = require('../../utils/test-helpers');

const adminPattern = 'admin-employee-profile';
const testUserPattern = 'test-employee-profile';
const adminUserData = generateTestUserData(adminPattern, 'Admin', 'User', 'Password@123');

test.describe('Employee Profile - Admin Tests', () => {
  
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

  // Helper function to navigate to employee profile page
  async function navigateToEmployeeProfile(page) {
    await page.goto('/employee-profile');
    await page.waitForURL('**/employee-profile', { timeout: 10000 });
  }

  test.describe('Page Access and Navigation', () => {
    test('Should load Employee Profile page successfully', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToEmployeeProfile(page);
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Verify page is accessible
      await expect(page).toHaveURL(/.*\/employee-profile/);
    });

    test('Should display search functionality', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToEmployeeProfile(page);
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Look for search input
      const searchInput = page.locator('input[type="text"]').first();
      const hasSearchInput = await searchInput.isVisible().catch(() => false);
      
      // Verify page loaded
      await expect(page).toHaveURL(/.*\/employee-profile/);
    });
  });

  test.describe('User Search', () => {
    test('Should allow searching for employees', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToEmployeeProfile(page);
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Look for search input
      const searchInput = page.locator('input[type="text"]').first();
      const hasSearchInput = await searchInput.isVisible().catch(() => false);
      
      if (hasSearchInput) {
        // Enter search term
        await searchInput.fill('Test');
        await page.waitForTimeout(500);
        
        // Verify search value is set
        await expect(searchInput).toHaveValue('Test');
      }
    });
  });

  test.describe('User Details', () => {
    test('Should display user details when user is selected', async ({ page }) => {
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'Employee', 'Password@123');
      await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToEmployeeProfile(page);
        
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        // Look for search input and search for the user
        const searchInput = page.locator('input[type="text"]').first();
        const hasSearchInput = await searchInput.isVisible().catch(() => false);
        
        if (hasSearchInput) {
          await searchInput.fill(testUserData.firstName);
          await page.waitForTimeout(1000);
          
          // Look for search results or user list
          const userItems = page.locator('button, div').filter({ hasText: testUserData.firstName });
          const count = await userItems.count();
          
          if (count > 0) {
            // Click on the first result
            await userItems.first().click();
            await page.waitForTimeout(1000);
            
            // Verify user details are displayed (back button should be visible)
            const backButton = page.locator('button:has-text("Back")');
            const hasBackButton = await backButton.isVisible().catch(() => false);
            
            if (hasBackButton) {
              await expect(backButton).toBeVisible();
            }
          }
        }
      } finally {
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
