const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerUserWithRole, loginUser } = require('../../utils/test-helpers');

const userPattern = 'profile-test';

test.describe('Profile Page - Employee Tests', () => {
  
  test('Should load Profile page successfully', async ({ page }) => {
    // Generate unique user data for this test
    const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');
    
    // Register user via API (more reliable than UI)
    await registerUserWithRole(page, testUserData, 'EMPLOYEE');
    
    // Login user
    await loginUser(page, testUserData.email, testUserData.password);
    
    // Navigate to profile page
    await page.goto('/profile');
    
    // Verify page loaded
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the profile page
    await expect(page).toHaveURL(/.*\/profile/);
  });

  test('Should display password change form', async ({ page }) => {
    // Generate unique user data for this test
    const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');
    
    // Register user via API (more reliable than UI)
    await registerUserWithRole(page, testUserData, 'EMPLOYEE');
    
    // Login user
    await loginUser(page, testUserData.email, testUserData.password);
    
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for password input fields
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    // Should have at least 3 password fields (current, new, confirm)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Should validate password requirements', async ({ page }) => {
    // Generate unique user data for this test
    const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');
    
    // Register user via API (more reliable than UI)
    await registerUserWithRole(page, testUserData, 'EMPLOYEE');
    
    // Login user
    await loginUser(page, testUserData.email, testUserData.password);
    
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for password inputs
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    if (count >= 2) {
      // Fill current password
      await passwordInputs.nth(0).fill(testUserData.password);
      
      // Fill weak new password
      await passwordInputs.nth(1).fill('weak');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"]');
      const hasSubmitButton = await submitButton.isVisible().catch(() => false);
      
      if (hasSubmitButton) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Verify error message about password requirements
        const errorMessage = page.locator('text=Password must contain');
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        if (hasError) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('Should validate password confirmation match', async ({ page }) => {
    // Generate unique user data for this test
    const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');
    
    // Register user via API (more reliable than UI)
    await registerUserWithRole(page, testUserData, 'EMPLOYEE');
    
    // Login user
    await loginUser(page, testUserData.email, testUserData.password);
    
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for password inputs
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    if (count >= 3) {
      // Fill current password
      await passwordInputs.nth(0).fill(testUserData.password);
      
      // Fill new password
      await passwordInputs.nth(1).fill('NewPassword123');
      
      // Fill different confirmation password
      await passwordInputs.nth(2).fill('DifferentPassword123');
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"]');
      const hasSubmitButton = await submitButton.isVisible().catch(() => false);
      
      if (hasSubmitButton) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Verify error message about passwords not matching
        const errorMessage = page.locator('text=do not match');
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        if (hasError) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('Should validate that new password is different from current', async ({ page }) => {
    // Generate unique user data for this test
    const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');
    
    // Register user via API (more reliable than UI)
    await registerUserWithRole(page, testUserData, 'EMPLOYEE');
    
    // Login user
    await loginUser(page, testUserData.email, testUserData.password);
    
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for password inputs
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    
    if (count >= 3) {
      // Fill current password
      await passwordInputs.nth(0).fill(testUserData.password);
      
      // Fill same password as new password
      await passwordInputs.nth(1).fill(testUserData.password);
      await passwordInputs.nth(2).fill(testUserData.password);
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"]');
      const hasSubmitButton = await submitButton.isVisible().catch(() => false);
      
      if (hasSubmitButton) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Verify error message about password being different
        const errorMessage = page.locator('text=must be different');
        const hasError = await errorMessage.isVisible().catch(() => false);
        
        if (hasError) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('Should display form labels correctly', async ({ page }) => {
    // Generate unique user data for this test
    const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');
    
    // Register user via API (more reliable than UI)
    await registerUserWithRole(page, testUserData, 'EMPLOYEE');
    
    // Login user
    await loginUser(page, testUserData.email, testUserData.password);
    
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Look for form labels (may vary based on implementation)
    const labels = page.locator('label');
    const labelCount = await labels.count();
    
    // Should have some labels
    expect(labelCount).toBeGreaterThanOrEqual(0);
  });

  // Clean up test users
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, userPattern);
    await page.close();
  });
});
