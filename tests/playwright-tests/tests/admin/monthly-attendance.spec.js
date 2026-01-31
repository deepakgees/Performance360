const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerUserWithRole } = require('../../utils/test-helpers');

const adminPattern = 'admin-monthly-attendance';
const adminUserData = generateTestUserData(adminPattern, 'Admin', 'User', 'Password@123');

test.describe('Monthly Attendance Management - Positive Tests', () => {
  
  test.beforeAll(async ({ browser }) => {
    // Create admin user with ADMIN role
    const adminPage = await browser.newPage();
    await registerUserWithRole(adminPage, adminUserData, 'ADMIN');
    await adminPage.close();
  });

  // Helper function to login as admin
  async function loginAsAdmin(page) {
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUserData.email);
    await page.fill('input[name="password"]', adminUserData.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/^http:\/\/localhost:\d+\/?$/, { timeout: 10000 });
  }

  // Helper function to navigate to monthly attendance page
  async function navigateToMonthlyAttendance(page) {
    await page.goto('/settings/monthly-attendance');
    await page.waitForURL('**/settings/monthly-attendance', { timeout: 10000 });
    await page.waitForSelector('h1:has-text("Monthly Attendance Management")', { timeout: 10000 });
  }

  test.describe('Page Access and Navigation', () => {
    test('Should load Monthly Attendance Management page successfully', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Verify page title
      await expect(page.locator('h1:has-text("Monthly Attendance Management")')).toBeVisible();
      
      // Verify tabs are visible
      await expect(page.locator('button:has-text("View/Edit")')).toBeVisible();
      await expect(page.locator('button:has-text("Bulk Edit")')).toBeVisible();
      
      // Verify View/Edit tab is active by default
      const viewEditTab = page.locator('button:has-text("View/Edit")');
      await expect(viewEditTab).toHaveClass(/border-indigo-500/);
      
      // Verify table is displayed (shows all records by default)
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    });

    test('Should switch between View/Edit and Bulk Edit tabs', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Click Bulk Edit tab
      await page.click('button:has-text("Bulk Edit")');
      
      // Verify Bulk Edit tab is active
      const bulkEditTab = page.locator('button:has-text("Bulk Edit")');
      await expect(bulkEditTab).toHaveClass(/border-indigo-500/);
      
      // Switch back to View/Edit tab
      await page.click('button:has-text("View/Edit")');
      await expect(page.locator('h1:has-text("Monthly Attendance Management")')).toBeVisible();
    });
  });

  test.describe('View/Edit Tab - Filters', () => {
    test('Should display filter controls', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Verify filter controls are visible
      await expect(page.locator('label:has-text("Filter by Year")')).toBeVisible();
      await expect(page.locator('label:has-text("Filter by Month")')).toBeVisible();
      await expect(page.locator('label:has-text("Filter by Employee Name")')).toBeVisible();
    });

    test('Should display pagination controls when records exist', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Check if pagination controls exist (they only show when there are records)
      const table = page.locator('table');
      const hasRecords = await table.locator('tbody tr').count().then(count => count > 0);
      
      if (hasRecords) {
        // Verify pagination controls are visible
        await expect(page.locator('text=/Showing.*records/')).toBeVisible({ timeout: 5000 });
        const itemsPerPageSelect = page.locator('select').filter({ hasText: 'per page' });
        if (await itemsPerPageSelect.count() > 0) {
          await expect(itemsPerPageSelect).toBeVisible();
        }
      }
    });

    test('Should display all records by default without filters', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Verify year filter is empty (no default year)
      const yearInput = page.locator('input[type="number"]').first();
      const yearValue = await yearInput.inputValue();
      expect(yearValue).toBe('');
      
      // Verify month filter shows "All Months"
      const monthSelect = page.locator('select').first();
      await expect(monthSelect).toHaveValue('');
      
      // Verify employee name filter is empty
      const employeeNameInput = page.locator('input[placeholder*="Search by name"]');
      const employeeValue = await employeeNameInput.inputValue();
      expect(employeeValue).toBe('');
    });

    test('Should filter by year', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      const currentYear = new Date().getFullYear();
      const yearInput = page.locator('input[type="number"]').first();
      await yearInput.fill(currentYear.toString());
      
      // Wait for filtering to complete (client-side filtering)
      await page.waitForTimeout(500);
      
      // Verify filter value is set
      await expect(yearInput).toHaveValue(currentYear.toString());
      
      // Verify table is visible (may be empty if no records for that year)
      await expect(page.locator('table')).toBeVisible();
    });

    test('Should filter by month', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      const monthSelect = page.locator('select').first();
      await monthSelect.selectOption({ value: '1' }); // January
      
      // Wait for filtering to complete (client-side filtering)
      await page.waitForTimeout(500);
      
      // Verify filter value is set
      await expect(monthSelect).toHaveValue('1');
      
      // Verify table is visible (may be empty if no records for that month)
      await expect(page.locator('table')).toBeVisible();
    });

    test('Should filter by employee name', async ({ page }) => {
      // Create a test user for filtering
      const testUserPattern = 'attendance-filter-test';
      const testUserData = generateTestUserData(testUserPattern, 'Filter', 'TestUser', 'Password@123');
      await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToMonthlyAttendance(page);
        
        // Filter by employee name
        const employeeNameInput = page.locator('input[placeholder*="Search by name"]');
        await employeeNameInput.fill('Filter');
        
        // Wait for filtering to complete (client-side filtering)
        await page.waitForTimeout(500);
        
        // Verify filter value is set
        await expect(employeeNameInput).toHaveValue('Filter');
        
        // Verify table is visible
        await expect(page.locator('table')).toBeVisible();
      } finally {
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('View/Edit Tab - Create Attendance Record', () => {
    test('Should open Add Attendance form modal', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Click Add Attendance button
      await page.click('button:has-text("Add Attendance")');
      await page.waitForSelector('h3:has-text("Add Attendance Record")', { timeout: 5000 });
      
      // Verify modal is visible
      await expect(page.locator('h3:has-text("Add Attendance Record")')).toBeVisible();
    });

    test('Should display all form fields in Add Attendance form', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Click Add Attendance button
      await page.click('button:has-text("Add Attendance")');
      await page.waitForSelector('h3:has-text("Add Attendance Record")', { timeout: 5000 });
      
      // Verify all form fields are present
      await expect(page.locator('label:has-text("Employee *")')).toBeVisible();
      await expect(page.locator('select[name="userId"]')).toBeVisible();
      await expect(page.locator('label:has-text("Month *")')).toBeVisible();
      await expect(page.locator('select[name="month"]')).toBeVisible();
      await expect(page.locator('label:has-text("Year *")')).toBeVisible();
      await expect(page.locator('input[name="year"]')).toBeVisible();
      await expect(page.locator('label:has-text("Working Days *")')).toBeVisible();
      await expect(page.locator('input[name="workingDays"]')).toBeVisible();
      await expect(page.locator('label:has-text("Present in Office *")')).toBeVisible();
      await expect(page.locator('input[name="presentInOffice"]')).toBeVisible();
      await expect(page.locator('label:has-text("Leaves Availed")')).toBeVisible();
      await expect(page.locator('input[name="leavesAvailed"]')).toBeVisible();
      await expect(page.locator('label:has-text("Leave Notifications in Teams Channel")')).toBeVisible();
      await expect(page.locator('input[name="leaveNotificationsInTeamsChannel"]')).toBeVisible();
      await expect(page.locator('label:has-text("Weekly Compliance")')).toBeVisible();
      await expect(page.locator('select[name="weeklyCompliance"]')).toBeVisible();
      await expect(page.locator('label:has-text("Exception Approved")')).toBeVisible();
      await expect(page.locator('select[name="exceptionApproved"]')).toBeVisible();
      await expect(page.locator('label:has-text("Reason for Non-Compliance")')).toBeVisible();
      await expect(page.locator('textarea[name="reasonForNonCompliance"]')).toBeVisible();
    });

    test('Should create attendance record successfully', async ({ page }) => {
      // Create a new user specifically for this test
      const testUserPattern = 'attendance-create-test';
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'Employee', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToMonthlyAttendance(page);
        
        // Click Add Attendance
        await page.click('button:has-text("Add Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { timeout: 5000 });
        
        // Wait for the user dropdown to populate
        await page.waitForSelector('select[name="userId"]', { timeout: 10000 });
        
        // Select the newly created user by name
        const userLabel = `${testUserData.firstName} ${testUserData.lastName} - ${testUserData.email}`;
        await page.selectOption('select[name="userId"]', { label: userLabel });
        
        // Fill form
        await page.selectOption('select[name="month"]', { value: '1' }); // January
        await page.fill('input[name="year"]', '2025');
        await page.fill('input[name="workingDays"]', '22');
        await page.fill('input[name="presentInOffice"]', '10');
        await page.fill('input[name="leavesAvailed"]', '2');
        await page.fill('input[name="leaveNotificationsInTeamsChannel"]', '1.5');
        await page.selectOption('select[name="weeklyCompliance"]', { value: 'true' });
        await page.selectOption('select[name="exceptionApproved"]', { value: 'false' });
        await page.fill('textarea[name="reasonForNonCompliance"]', 'Test reason');
        
        // Submit
        await page.click('button:has-text("Create Attendance")');
        
        // Wait for modal to close (form submitted)
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { state: 'hidden', timeout: 10000 });
        
        // Verify success notification message is displayed
        const successNotification = page.locator('[data-testid="success-notification"]');
        await expect(successNotification).toBeVisible({ timeout: 10000 });
        await expect(successNotification).toContainText('Attendance record created successfully!');
      } finally {
        // Clean up: delete the test user
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('View/Edit Tab - Edit Attendance Record', () => {
    test('Should open Edit Attendance form modal', async ({ page }) => {
      // Create a new user and attendance record for this test
      const testUserPattern = 'attendance-edit-test';
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'Employee', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToMonthlyAttendance(page);
        
        // Create an attendance record first
        await page.click('button:has-text("Add Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { timeout: 5000 });
        await page.waitForSelector('select[name="userId"]', { timeout: 10000 });
        
        const userLabel = `${testUserData.firstName} ${testUserData.lastName} - ${testUserData.email}`;
        await page.selectOption('select[name="userId"]', { label: userLabel });
        await page.selectOption('select[name="month"]', { value: '2' }); // February
        await page.fill('input[name="year"]', '2025');
        await page.fill('input[name="workingDays"]', '20');
        await page.fill('input[name="presentInOffice"]', '10');
        await page.fill('input[name="leavesAvailed"]', '2');
        await page.click('button:has-text("Create Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { state: 'hidden', timeout: 10000 });
        
        // Wait for success notification and table to update
        await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
        await page.waitForTimeout(1000);
        
        // Filter by the test user to find the created record (since we now show all records with pagination)
        const employeeNameInput = page.locator('input[placeholder*="Search by name"]');
        await employeeNameInput.fill(testUserData.firstName);
        
        // Wait for table to update after filtering and find the row with the test user
        await page.waitForTimeout(1000);
        const userFullName = `${testUserData.firstName} ${testUserData.lastName}`;
        const userRow = page.locator('table tbody tr').filter({ hasText: userFullName }).first();
        await expect(userRow).toBeVisible({ timeout: 5000 });
        
        // Find the Edit button within the user's row
        const editButton = userRow.locator('button:has-text("Edit")');
        await expect(editButton).toBeVisible({ timeout: 5000 });
        await editButton.scrollIntoViewIfNeeded();
        await editButton.click();
        
        // Wait for the edit modal to appear
        await page.waitForSelector('h3:has-text("Edit Attendance Record")', { timeout: 10000 });
        
        // Verify modal is visible with edit title
        await expect(page.locator('h3:has-text("Edit Attendance Record")')).toBeVisible();
      } finally {
        await deleteUsersByPattern(page, testUserPattern);
      }
    });

    test('Should update attendance record successfully', async ({ page }) => {
      // Create a new user and attendance record for this test
      const testUserPattern = 'attendance-update-test';
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'Employee', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToMonthlyAttendance(page);
        
        // Create an attendance record first
        await page.click('button:has-text("Add Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { timeout: 5000 });
        await page.waitForSelector('select[name="userId"]', { timeout: 10000 });
        
        const userLabel = `${testUserData.firstName} ${testUserData.lastName} - ${testUserData.email}`;
        await page.selectOption('select[name="userId"]', { label: userLabel });
        await page.selectOption('select[name="month"]', { value: '3' }); // March
        await page.fill('input[name="year"]', '2025');
        await page.fill('input[name="workingDays"]', '22');
        await page.fill('input[name="presentInOffice"]', '10');
        await page.fill('input[name="leavesAvailed"]', '2');
        await page.fill('input[name="leaveNotificationsInTeamsChannel"]', '1.5');
        await page.click('button:has-text("Create Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { state: 'hidden', timeout: 10000 });
        
        // Wait for success notification and table to update
        await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
        await page.waitForTimeout(1000);
        
        // Filter by the test user to find the created record (since we now show all records with pagination)
        const employeeNameInput = page.locator('input[placeholder*="Search by name"]');
        await employeeNameInput.fill(testUserData.firstName);
        
        // Wait for table to update after filtering and find the row with the test user
        await page.waitForTimeout(1000);
        const userFullName = `${testUserData.firstName} ${testUserData.lastName}`;
        const userRow = page.locator('table tbody tr').filter({ hasText: userFullName }).first();
        await expect(userRow).toBeVisible({ timeout: 5000 });
        
        // Find the Edit button within the user's row
        const editButton = userRow.locator('button:has-text("Edit")');
        await expect(editButton).toBeVisible({ timeout: 5000 });
        await editButton.scrollIntoViewIfNeeded();
        await editButton.click();
        
        // Wait for the edit modal to appear
        await page.waitForSelector('h3:has-text("Edit Attendance Record")', { timeout: 10000 });
        
        // Update Leave Notifications in Teams Channel
        const leaveNotificationsField = page.locator('input[name="leaveNotificationsInTeamsChannel"]');
        await leaveNotificationsField.clear();
        await leaveNotificationsField.fill('3.0');
        
        // Update other fields
        await page.fill('input[name="presentInOffice"]', '10');
        await page.fill('input[name="leavesAvailed"]', '1');
        
        // Submit
        await page.click('button:has-text("Update Attendance")');
        
        // Wait for modal to close
        await page.waitForSelector('h3:has-text("Edit Attendance Record")', { state: 'hidden', timeout: 10000 });
        
        // Verify success notification
        const successNotification = page.locator('[data-testid="success-notification"]');
        await expect(successNotification).toBeVisible({ timeout: 10000 });
        await expect(successNotification).toContainText('Attendance record updated successfully!');
      } finally {
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('View/Edit Tab - Delete Attendance Record', () => {
    test('Should delete attendance record successfully', async ({ page }) => {
      // Create a new user and attendance record for this test
      const testUserPattern = 'attendance-delete-test';
      const testUserData = generateTestUserData(testUserPattern, 'Test', 'Employee', 'Password@123');
      const createdUser = await registerUserWithRole(page, testUserData, 'EMPLOYEE');
      
      try {
        await loginAsAdmin(page);
        await navigateToMonthlyAttendance(page);
        
        // Create an attendance record first
        await page.click('button:has-text("Add Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { timeout: 5000 });
        await page.waitForSelector('select[name="userId"]', { timeout: 10000 });
        
        const userLabel = `${testUserData.firstName} ${testUserData.lastName} - ${testUserData.email}`;
        await page.selectOption('select[name="userId"]', { label: userLabel });
        await page.selectOption('select[name="month"]', { value: '4' }); // April
        await page.fill('input[name="year"]', '2025');
        await page.fill('input[name="workingDays"]', '22');
        await page.fill('input[name="presentInOffice"]', '10');
        await page.fill('input[name="leavesAvailed"]', '2');
        await page.click('button:has-text("Create Attendance")');
        await page.waitForSelector('h3:has-text("Add Attendance Record")', { state: 'hidden', timeout: 10000 });
        
        // Wait for success notification and table to update
        await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });
        await page.waitForTimeout(1000);
        
        // Filter by the test user to find the created record (since we now show all records with pagination)
        const employeeNameInput = page.locator('input[placeholder*="Search by name"]');
        await employeeNameInput.fill(testUserData.firstName);
        await page.waitForTimeout(500);
        
        // Find and click Delete button
        const deleteButtons = page.locator('button:has-text("Delete")');
        const count = await deleteButtons.count();
        expect(count).toBeGreaterThan(0);
        
        // Set up dialog handler for confirmation
        page.once('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          await dialog.accept();
        });
        
        await deleteButtons.first().click();
        
        // Wait for success notification
        const successNotification = page.locator('[data-testid="success-notification"]');
        await expect(successNotification).toBeVisible({ timeout: 10000 });
        await expect(successNotification).toContainText('Attendance record deleted successfully!');
      } finally {
        await deleteUsersByPattern(page, testUserPattern);
      }
    });
  });

  test.describe('Bulk Edit Tab', () => {
    test('Should display Bulk Edit view with required controls', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Click Bulk Edit tab
      await page.click('button:has-text("Bulk Edit")');
      
      // Verify we're on Bulk Edit tab by checking that "Add Attendance" button is not present
      await expect(page.locator('button:has-text("Add Attendance")')).not.toBeVisible({ timeout: 5000 });
      
      // Verify controls are visible
      await expect(page.locator('label:has-text("Business Unit")')).toBeVisible();
      await expect(page.locator('label:has-text("Month")')).toBeVisible();
      await expect(page.locator('label:has-text("Year")')).toBeVisible();
    });

    test('Should display table columns in Bulk Edit view', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Click Bulk Edit tab
      await page.click('button:has-text("Bulk Edit")');
      
      // Verify we're on Bulk Edit tab by checking "Add Attendance" button is not present
      await expect(page.locator('button:has-text("Add Attendance")')).not.toBeVisible({ timeout: 5000 });
      
      // Select business unit if available
      const businessUnitSelect = page.locator('select').first();
      const options = await businessUnitSelect.locator('option').count();
      if (options > 1) {
        await businessUnitSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        // Verify column headers exist
        await expect(page.locator('th:has-text("Employee")')).toBeVisible();
        await expect(page.locator('th:has-text("Working Days")')).toBeVisible();
        await expect(page.locator('th:has-text("Present in Office")')).toBeVisible();
        await expect(page.locator('th:has-text("Leaves Availed")')).toBeVisible();
        await expect(page.locator('th:has-text("Leave Notifications in Teams")')).toBeVisible();
        await expect(page.locator('th:has-text("Weekly Compliance")')).toBeVisible();
        await expect(page.locator('th:has-text("Exception Approved")')).toBeVisible();
        await expect(page.locator('th:has-text("Reason for Non-Compliance")')).toBeVisible();
      }
    });

    test('Should display CSV upload section', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToMonthlyAttendance(page);
      
      // Click Bulk Edit tab
      await page.click('button:has-text("Bulk Edit")');
      
      // Verify we're on Bulk Edit tab by checking "Add Attendance" button is not present
      await expect(page.locator('button:has-text("Add Attendance")')).not.toBeVisible({ timeout: 5000 });
      
      // Select a business unit first (CSV upload section only appears after business unit is selected)
      const businessUnitSelect = page.locator('select').first();
      const options = await businessUnitSelect.locator('option').count();
      
      // Verify business units are available (need at least 2: placeholder + 1 business unit)
      if (options > 1) {
        // Select the first available business unit (index 0 is placeholder, index 1 is first business unit)
        await businessUnitSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000); // Wait for users to load
        
        // Verify CSV upload section exists (only visible when business unit is selected and users are loaded)
        const csvSection = page.locator('text=Upload CSV to Update Attendance');
        await expect(csvSection).toBeVisible({ timeout: 5000 });
        
        // Verify template download link exists
        const templateLink = page.locator('a:has-text("Download Template")');
        await expect(templateLink).toBeVisible();
      } else {
        // If no business units are available, just verify the controls are present
        // (CSV section won't be visible without a business unit)
        await expect(page.locator('label:has-text("Business Unit")')).toBeVisible();
        await expect(page.locator('label:has-text("Month")')).toBeVisible();
        await expect(page.locator('label:has-text("Year")')).toBeVisible();
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
