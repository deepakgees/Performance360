const { test, expect } = require('@playwright/test');
const { deleteUser, deleteUsersByPattern, generateTestUserData } = require('../../utils/test-helpers');

// Generate unique test data using helper function
const userPattern = 'registrationuser';
const testUserData = generateTestUserData(userPattern, 'John', 'Doe', 'Password@123');
    
test.describe('User Registration and Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Visit the registration page before each test
    await page.goto('/register');
  });

  test('should successfully register a new user and then login with those credentials', async ({ page }) => {
    // Step 1: Register the user
    await page.fill('#register-first-name', testUserData.firstName);
    await page.fill('#register-last-name', testUserData.lastName);
    await page.fill('#register-email', testUserData.email);
    await page.fill('#register-password', testUserData.password);

    // Submit the registration form
    await page.click('#register-submit-button');

    // Verify successful registration by checking URL redirect to login
    await expect(page).toHaveURL(/.*\/login/);

    // Step 2: Login with the newly created credentials
    await page.fill('#login-email', testUserData.email);
    await page.fill('#login-password', testUserData.password);

    // Submit the login form
    await page.click('#login-submit-button');

    // Verify user is logged in by checking for user information on dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
  });

  // Clean up any remaining test users after all tests
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, userPattern);
    await page.close();
  });
}); 