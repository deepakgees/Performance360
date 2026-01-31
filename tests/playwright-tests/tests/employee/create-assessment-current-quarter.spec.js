const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerAndLoginUserViaUI } = require('../../utils/test-helpers');

const userPattern = 'assessmenttest';
// Generate unique test data using helper function
const testUserData = generateTestUserData(userPattern, 'Test', 'User', 'Password@123');

test.describe('Create Assessment for Current Quarter', () => {
  
  test('Should create a new assessment with dummy values for current quarter', async ({ page }) => {
    
    // Register and login user using reusable helper method
    const result = await registerAndLoginUserViaUI(page, testUserData);
    
    // Verify registration and login were successful
    expect(result.success).toBe(true);

    // Navigate to self-assessment page
    await page.goto('/self-assessment');
    
    // Wait for the page to load
    await page.waitForSelector('#self-assessment-title', { timeout: 10000 });
    
    // Click on "Create New Assessment" tab
    await page.click('#create-assessment-tab');
    
    // Wait for the create assessment form to be visible
    await page.waitForSelector('text=Create New Assessment', { timeout: 5000 });
    
    // Year and quarter are now selected by default (previous quarter)
    // No need to select them manually
    
    // Click "Start Assessment" button
    await page.click('button:has-text("Start Assessment")');
    
    // Wait for the first question to appear
    await page.waitForSelector('text=How would you rate yourself', { timeout: 5000 });
    
    // Step 1: Fill in rating question (1-5 scale) - Select rating 4
    const ratingButtons = page.locator('button').filter({ hasText: /^[1-5]$/ });
    await ratingButtons.nth(3).click(); // Select rating 4 (index 3)
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 2: Fill in achievements question
    await page.waitForSelector('textarea', { timeout: 5000 });
    const achievementsText = `Key achievements:
- Successfully completed major project milestones
- Improved team collaboration and communication
- Delivered high-quality code with minimal bugs
- Mentored junior team members
- Participated in knowledge sharing sessions`;
    await page.fill('textarea', achievementsText);
    await page.click('button:has-text("Next")');
    
    // Step 3: Fill in improvements question
    await page.waitForSelector('textarea', { timeout: 5000 });
    const improvementsText = `Areas for improvement:
- Enhance technical documentation skills
- Improve time management for complex tasks
- Strengthen presentation and public speaking abilities
- Learn new technologies and frameworks
- Better work-life balance`;
    await page.fill('textarea', improvementsText);
    await page.click('button:has-text("Next")');
    
    // Step 4: Fill in satisfaction question - Select "Very Satisfied"
    await page.waitForSelector('input[type="radio"]', { timeout: 5000 });
    await page.click('input[value="Very Satisfied"]');
    await page.click('button:has-text("Next")');
    
    // Step 5: Fill in aspirations question
    await page.waitForSelector('textarea', { timeout: 5000 });
    const aspirationsText = `Career aspirations and expectations:
- Take on more leadership responsibilities
- Work on challenging and innovative projects
- Receive opportunities for professional development and training
- Advance to senior role with increased technical ownership
- Contribute to architectural decisions and technical strategy`;
    await page.fill('textarea', aspirationsText);
    await page.click('button:has-text("Next")');
    
    // Step 6: Fill in team changes question (final question)
    await page.waitForSelector('textarea', { timeout: 5000 });
    const teamChangesText = `Team improvements I would make if I had the power:
- Implement more structured code review processes
- Increase cross-team collaboration and knowledge sharing
- Establish clearer communication channels
- Improve documentation standards and practices
- Create more opportunities for team building and bonding`;
    await page.fill('textarea', teamChangesText);
    
    // Submit assessment
    await page.click('button:has-text("Submit Assessment")');
    
    // Wait for submission to complete
    // The component shows a success notification and switches to view tab after submission
    // Wait for either the success message or the view assessments section to appear
    await Promise.race([
      page.waitForSelector('text=Assessment submitted successfully', { timeout: 10000 }).catch(() => {}),
      page.waitForSelector('#view-assessments-section', { timeout: 10000 }).catch(() => {})
    ]);
    
    // Verify we're no longer in the assessment form (the form should be gone)
    const assessmentForm = page.locator('text=How would you rate yourself');
    await expect(assessmentForm).not.toBeVisible({ timeout: 5000 });
    
    // Verify we can see the view assessments section or the view tab is visible
    const viewSection = page.locator('#view-assessments-section');
    const viewTab = page.locator('#view-assessments-tab');
    
    // At least one of these should be visible/accessible
    const isViewSectionVisible = await viewSection.isVisible().catch(() => false);
    const isViewTabVisible = await viewTab.isVisible().catch(() => false);
    
    expect(isViewSectionVisible || isViewTabVisible).toBeTruthy();
    
    console.log(`Successfully created assessment`);
  });

  // Clean up any remaining test users after all tests
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, userPattern);
    await page.close();
  });
});

