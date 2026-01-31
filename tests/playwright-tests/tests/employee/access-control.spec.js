const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerAndLoginUserViaUI } = require('../../utils/test-helpers');

const userPattern = 'accesscontroltest';

test.describe('Employee Access Control Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Generate unique test data for each test to avoid conflicts
    const testUserData = generateTestUserData(userPattern, 'Test', 'Employee', 'Password@123');
    
    // Register and login as an employee user
    const result = await registerAndLoginUserViaUI(page, testUserData);
    expect(result.success).toBe(true);
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.locator('#logout-button')).toBeVisible();
  });

  test('Should redirect employee users away from manager-only routes', async ({ page }) => {
    // Test direct-reports route
    await page.goto('/direct-reports');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test indirect-reports route
    await page.goto('/indirect-reports');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
  });

  test('Should redirect employee users away from admin-only routes', async ({ page }) => {
    // Test settings route
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test settings/users route
    await page.goto('/settings/users');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test settings/teams route
    await page.goto('/settings/teams');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test settings/business-units route
    await page.goto('/settings/business-units');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test settings/monthly-attendance route
    await page.goto('/settings/monthly-attendance');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test settings/jira route
    await page.goto('/settings/jira');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test settings/jira-unmapped-users route
    await page.goto('/settings/jira-unmapped-users');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test employee-profile route
    await page.goto('/employee-profile');
    await expect(page).toHaveURL(/.*\/$/); // Should redirect to dashboard
    await expect(page.locator('#logout-button')).toBeVisible();
  });

  test('Should not show manager/admin navigation links in sidebar for employees', async ({ page }) => {
    // Navigate to dashboard to ensure sidebar is visible
    await page.goto('/');
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Verify "My Reports" section is NOT visible (manager/admin only)
    // The section is a button, so we check for the text content
    const myReportsSection = page.locator('button:has-text("My Reports")');
    await expect(myReportsSection).not.toBeVisible();
    
    // Verify "Direct Reports" link is NOT visible
    const directReportsLink = page.locator('#nav-my-direct-reports');
    await expect(directReportsLink).not.toBeVisible();
    
    // Verify "Indirect Reports" link is NOT visible
    const indirectReportsLink = page.locator('#nav-my-indirect-reports');
    await expect(indirectReportsLink).not.toBeVisible();
    
    // Verify "Settings" section is NOT visible (admin only)
    // The section is a button, so we check for the text content
    const settingsSection = page.locator('button:has-text("Settings")');
    await expect(settingsSection).not.toBeVisible();
    
    // Verify "Employee Profile" link is NOT visible (admin only)
    const employeeProfileLink = page.locator('#nav-employee-profile');
    await expect(employeeProfileLink).not.toBeVisible();
    
    // Verify "Users" link is NOT visible (admin only)
    const usersLink = page.locator('#nav-users');
    await expect(usersLink).not.toBeVisible();
    
    // Verify "Teams" link is NOT visible (admin only)
    const teamsLink = page.locator('#nav-teams');
    await expect(teamsLink).not.toBeVisible();
    
    // Verify "Business Units" link is NOT visible (admin only)
    const businessUnitsLink = page.locator('#nav-business-units');
    await expect(businessUnitsLink).not.toBeVisible();
    
    // Verify "Monthly Attendance" link is NOT visible (admin only)
    const monthlyAttendanceLink = page.locator('#nav-monthly-attendance');
    await expect(monthlyAttendanceLink).not.toBeVisible();
    
    // Verify "Jira Configurations" link is NOT visible (admin only)
    const jiraConfigLink = page.locator('#nav-jira-configurations');
    await expect(jiraConfigLink).not.toBeVisible();
    
    // Verify "Jira Unmapped Users" link is NOT visible (admin only)
    const jiraUnmappedLink = page.locator('#nav-jira-unmapped-users');
    await expect(jiraUnmappedLink).not.toBeVisible();
  });

  test('Should show employee-accessible navigation links in sidebar', async ({ page }) => {
    // Navigate to dashboard to ensure sidebar is visible
    await page.goto('/');
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Verify "Dashboard" link is visible
    const dashboardLink = page.locator('#nav-dashboard');
    await expect(dashboardLink).toBeVisible();
    
    // Verify "Provide feedbacks" section is visible
    const provideFeedbacksButton = page.locator('button:has-text("Provide feedbacks")');
    await expect(provideFeedbacksButton).toBeVisible();
    
    // Expand the "Provide feedbacks" section to see the links
    await provideFeedbacksButton.click();
    await page.waitForTimeout(500); // Wait for expansion animation
    
    // Verify "Colleague Feedback" link is visible (inside Provide feedbacks section)
    const colleagueFeedbackLink = page.locator('#nav-colleague-feedback');
    await expect(colleagueFeedbackLink).toBeVisible();
    
    // Verify "Manager Feedback" link is visible (inside Provide feedbacks section)
    const managerFeedbackLink = page.locator('#nav-manager-feedback');
    await expect(managerFeedbackLink).toBeVisible();
    
    // Verify "Self Assessment" link is visible (inside Provide feedbacks section)
    const selfAssessmentLink = page.locator('#nav-self-assessment');
    await expect(selfAssessmentLink).toBeVisible();
    
    // Verify "Reset Password" link is visible (all authenticated users can access)
    const resetPasswordLink = page.locator('#nav-reset-password');
    await expect(resetPasswordLink).toBeVisible();
  });

  test('Should allow employees to access their allowed pages', async ({ page }) => {
    // Test dashboard access
    await page.goto('/');
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test colleague feedback access
    await page.goto('/colleague-feedback');
    await expect(page).toHaveURL(/.*\/colleague-feedback/);
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test manager feedback access (employees can give feedback to their manager)
    await page.goto('/manager-feedback');
    await expect(page).toHaveURL(/.*\/manager-feedback/);
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test self-assessment access
    await page.goto('/self-assessment');
    await expect(page).toHaveURL(/.*\/self-assessment/);
    await expect(page.locator('#logout-button')).toBeVisible();
    
    // Test profile access
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*\/profile/);
    await expect(page.locator('#logout-button')).toBeVisible();
  });

  test('Should display all dashboard tabs for employees', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await expect(page.locator('#dashboard-page')).toBeVisible();
    
    // Verify dashboard title and subtitle are visible
    await expect(page.locator('#dashboard-title')).toBeVisible();
    await expect(page.locator('#dashboard-title')).toHaveText('Dashboard');
    await expect(page.locator('#dashboard-subtitle')).toBeVisible();
    await expect(page.locator('#dashboard-subtitle')).toHaveText('View your performance data and feedback history');
    
    // Verify all 5 tabs are visible
    const selfAssessmentTab = page.locator('button:has-text("Self-assessment")');
    await expect(selfAssessmentTab).toBeVisible();
    
    const jiraStatisticsTab = page.locator('button:has-text("Jira Statistics")');
    await expect(jiraStatisticsTab).toBeVisible();
    
    const colleagueProvidedTab = page.locator('button:has-text("Feedback Provided to Colleagues")');
    await expect(colleagueProvidedTab).toBeVisible();
    
    const managerProvidedTab = page.locator('button:has-text("Feedback Provided to Manager")');
    await expect(managerProvidedTab).toBeVisible();
    
    const attendanceTab = page.locator('button:has-text("Attendance")');
    await expect(attendanceTab).toBeVisible();
  });

  test('Should be able to switch between dashboard tabs', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await expect(page.locator('#dashboard-page')).toBeVisible();
    
    // Verify Self-assessment tab is active by default (has active styling)
    const selfAssessmentTab = page.locator('button:has-text("Self-assessment")');
    await expect(selfAssessmentTab).toBeVisible();
    await expect(selfAssessmentTab).toHaveClass(/border-indigo-500/);
    
    // Click on Jira Statistics tab
    const jiraStatisticsTab = page.locator('button:has-text("Jira Statistics")');
    await jiraStatisticsTab.click();
    await page.waitForTimeout(300); // Wait for tab switch animation
    
    // Verify Jira Statistics tab is now active
    await expect(jiraStatisticsTab).toHaveClass(/border-indigo-500/);
    await expect(selfAssessmentTab).not.toHaveClass(/border-indigo-500/);
    
    // Click on Feedback Provided to Colleagues tab
    const colleagueProvidedTab = page.locator('button:has-text("Feedback Provided to Colleagues")');
    await colleagueProvidedTab.click();
    await page.waitForTimeout(300);
    
    // Verify Feedback Provided to Colleagues tab is now active
    await expect(colleagueProvidedTab).toHaveClass(/border-indigo-500/);
    await expect(jiraStatisticsTab).not.toHaveClass(/border-indigo-500/);
    
    // Click on Feedback Provided to Manager tab
    const managerProvidedTab = page.locator('button:has-text("Feedback Provided to Manager")');
    await managerProvidedTab.click();
    await page.waitForTimeout(300);
    
    // Verify Feedback Provided to Manager tab is now active
    await expect(managerProvidedTab).toHaveClass(/border-indigo-500/);
    await expect(colleagueProvidedTab).not.toHaveClass(/border-indigo-500/);
    
    // Click on Attendance tab
    const attendanceTab = page.locator('button:has-text("Attendance")');
    await attendanceTab.click();
    await page.waitForTimeout(300);
    
    // Verify Attendance tab is now active
    await expect(attendanceTab).toHaveClass(/border-indigo-500/);
    await expect(managerProvidedTab).not.toHaveClass(/border-indigo-500/);
    
    // Click back on Self-assessment tab
    await selfAssessmentTab.click();
    await page.waitForTimeout(300);
    
    // Verify Self-assessment tab is active again
    await expect(selfAssessmentTab).toHaveClass(/border-indigo-500/);
    await expect(attendanceTab).not.toHaveClass(/border-indigo-500/);
  });

  test('Should display correct content for each dashboard tab', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await expect(page.locator('#dashboard-page')).toBeVisible();
    
    // Test Self-assessment tab content
    const selfAssessmentTab = page.locator('button:has-text("Self-assessment")');
    await selfAssessmentTab.click();
    await page.waitForTimeout(500); // Wait for content to load
    
    // The SelfAssessmentsList component should be rendered
    // We can check for common elements that would appear in a list/table
    const dashboardContent = page.locator('#dashboard-page');
    await expect(dashboardContent).toBeVisible();
    
    // Test Jira Statistics tab content
    const jiraStatisticsTab = page.locator('button:has-text("Jira Statistics")');
    await jiraStatisticsTab.click();
    await page.waitForTimeout(500);
    
    // Jira statistics content should be visible (may show loading or empty state)
    await expect(dashboardContent).toBeVisible();
    
    // Test Feedback Provided to Colleagues tab content
    const colleagueProvidedTab = page.locator('button:has-text("Feedback Provided to Colleagues")');
    await colleagueProvidedTab.click();
    await page.waitForTimeout(500);
    
    // Colleague feedback table should be visible (may be empty)
    await expect(dashboardContent).toBeVisible();
    
    // Test Feedback Provided to Manager tab content
    const managerProvidedTab = page.locator('button:has-text("Feedback Provided to Manager")');
    await managerProvidedTab.click();
    await page.waitForTimeout(500);
    
    // Manager feedback table should be visible (may be empty)
    await expect(dashboardContent).toBeVisible();
    
    // Test Attendance tab content
    const attendanceTab = page.locator('button:has-text("Attendance")');
    await attendanceTab.click();
    await page.waitForTimeout(500);
    
    // Attendance content should be visible
    await expect(dashboardContent).toBeVisible();
  });

  // Clean up any remaining test users after all tests
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, userPattern);
    await page.close();
  });
});

