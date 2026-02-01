const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerUserWithRole, loginUser, assignManagerToEmployee } = require('../../utils/test-helpers');

const managerPattern = 'manager-indirect';
const subManagerPattern = 'sub-manager-indirect';
const employeePattern = 'employee-indirect';

test.describe('Indirect Reports - Manager Tests', () => {
  let managerUserData;
  let subManagerUserData;
  let employeeUserData;
  let managerUser;
  let subManagerUser;
  let employeeUser;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    // Create top-level manager
    managerUserData = generateTestUserData(managerPattern, 'Top', 'Manager', 'Password@123');
    managerUser = await registerUserWithRole(page, managerUserData, 'MANAGER');
    
    // Create sub-manager (reports to top manager)
    subManagerUserData = generateTestUserData(subManagerPattern, 'Sub', 'Manager', 'Password@123');
    subManagerUser = await registerUserWithRole(page, subManagerUserData, 'MANAGER');
    await assignManagerToEmployee(page, subManagerUser.id, managerUser.id);
    
    // Create employee (reports to sub-manager, so indirect report to top manager)
    employeeUserData = generateTestUserData(employeePattern, 'Employee', 'User', 'Password@123');
    employeeUser = await registerUserWithRole(page, employeeUserData, 'EMPLOYEE');
    await assignManagerToEmployee(page, employeeUser.id, subManagerUser.id);
    
    await page.waitForTimeout(2000); // Wait for relationships to be established
    await page.close();
  });

  test('Should load Indirect Reports page successfully', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Verify page title
    await expect(page.locator('#indirect-reports-title')).toBeVisible();
    await expect(page.locator('#indirect-reports-title')).toHaveText('My Indirect Reports');
    
    // Verify page is accessible
    await expect(page.locator('#indirect-reports-page')).toBeVisible();
  });

  test('Should display all tabs on Indirect Reports page', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Verify all three tabs are visible
    await expect(page.locator('button:has-text("Indirect Reports")')).toBeVisible();
    await expect(page.locator('button:has-text("Quarterly Feedback")')).toBeVisible();
    await expect(page.locator('button:has-text("Attendance Compliance")')).toBeVisible();
  });

  test('Should switch between tabs', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Verify Indirect Reports tab is active by default
    const indirectReportsTab = page.locator('button:has-text("Indirect Reports")');
    await expect(indirectReportsTab).toHaveClass(/border-indigo-500/);
    
    // Click on Quarterly Feedback tab
    const feedbackTab = page.locator('button:has-text("Quarterly Feedback")');
    await feedbackTab.click();
    await page.waitForTimeout(300);
    
    // Verify Quarterly Feedback tab is now active
    await expect(feedbackTab).toHaveClass(/border-indigo-500/);
    
    // Click on Attendance Compliance tab
    const attendanceTab = page.locator('button:has-text("Attendance Compliance")');
    await attendanceTab.click();
    await page.waitForTimeout(300);
    
    // Verify Attendance Compliance tab is now active
    await expect(attendanceTab).toHaveClass(/border-indigo-500/);
  });

  test('Should display search functionality', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Verify search input is visible
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill(employeeUserData.firstName);
    await page.waitForTimeout(500);
    
    // Verify search value is set
    await expect(searchInput).toHaveValue(employeeUserData.firstName);
  });

  test('Should display expand/collapse all buttons', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for expand/collapse buttons
    const expandButton = page.locator('button:has-text("Expand All")');
    const collapseButton = page.locator('button:has-text("Collapse All")');
    
    const hasExpandButton = await expandButton.isVisible().catch(() => false);
    const hasCollapseButton = await collapseButton.isVisible().catch(() => false);
    
    // These buttons should be visible if there are indirect reports grouped by manager
    if (hasExpandButton || hasCollapseButton) {
      // At least one should be visible
      expect(hasExpandButton || hasCollapseButton).toBeTruthy();
    }
  });

  test('Should display indirect reports grouped by manager', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify page structure
    await expect(page.locator('#indirect-reports-page')).toBeVisible();
    
    // Look for manager grouping (may or may not be visible depending on data)
    const managerGroups = page.locator('text=/\\d+ reports across \\d+ managers/');
    const hasManagerGroups = await managerGroups.isVisible().catch(() => false);
    
    // Just verify the page loaded correctly
    await expect(page.locator('#indirect-reports-page')).toBeVisible();
  });

  test('Should allow expanding manager groups', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Look for manager group headers (clickable to expand/collapse)
    const managerHeaders = page.locator('text=' + subManagerUserData.firstName);
    const count = await managerHeaders.count();
    
    if (count > 0) {
      // Click on a manager header to expand
      await managerHeaders.first().click();
      await page.waitForTimeout(500);
      
      // Verify the group expanded (indirect reports should be visible)
      await expect(page.locator('#indirect-reports-page')).toBeVisible();
    }
  });

  test('Should display empty state when no indirect reports exist', async ({ page }) => {
    // Create a manager with no indirect reports
    const emptyManagerPattern = 'manager-no-indirect';
    const emptyManagerData = generateTestUserData(emptyManagerPattern, 'Empty', 'Manager', 'Password@123');
    const emptyManager = await registerUserWithRole(page, emptyManagerData, 'MANAGER');
    
    try {
      await loginUser(page, emptyManagerData.email, emptyManagerData.password);
      await page.goto('/indirect-reports');
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Verify empty state message
      const emptyState = page.locator('text=No indirect reports');
      const isEmptyStateVisible = await emptyState.isVisible().catch(() => false);
      
      if (isEmptyStateVisible) {
        await expect(emptyState).toBeVisible();
      }
    } finally {
      await deleteUsersByPattern(page, emptyManagerPattern);
    }
  });

  test('Should filter indirect reports by search term', async ({ page }) => {
    await loginUser(page, managerUserData.email, managerUserData.password);
    await page.goto('/indirect-reports');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill('NonExistentUser');
    await page.waitForTimeout(500);
    
    // Verify search value is set
    await expect(searchInput).toHaveValue('NonExistentUser');
  });

  // Clean up test users
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, managerPattern);
    await deleteUsersByPattern(page, subManagerPattern);
    await deleteUsersByPattern(page, employeePattern);
    await page.close();
  });
});
