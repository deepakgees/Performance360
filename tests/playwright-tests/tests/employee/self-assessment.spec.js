const { test, expect } = require('@playwright/test');
const { deleteUser, deleteUsersByPattern, generateTestUserData, registerAndLoginUserViaUI } = require('../../utils/test-helpers');

const userPattern = 'selfassessment';
// Generate unique test data using helper function
const testUserData = generateTestUserData(userPattern, 'John', 'Doe', 'Password@123');
const assessmentData = {
  quarter: 'Q1',
  year: 2025,
  rating: 5,
  achievements: 'Achievements',
  improvements: 'Improvements',
  satisfaction: 'Very Satisfied',
  aspirations: 'Career aspirations and expectations',
  teamChanges: 'Team Changes'
};

test.describe('Self Assessment flow', () => {    
  
  test('Should be able to provide self-assessment for an employee', async ({ page }) => {
    
    // Register and login user using reusable helper method
    const result = await registerAndLoginUserViaUI(page, testUserData);
    
    // Verify registration and login were successful
    expect(result.success).toBe(true);

    //add self-assessment
    await addSelfAssessment(page, assessmentData);
    
  });

  async function addSelfAssessment(page, assessment) {
          
        // Navigate to self-assessment page
        await page.goto('/self-assessment');
        await page.click('#create-assessment-tab');
        
        // Check if assessment already exists for this period
        const existingAssessment = page.locator(`text=${assessment.quarter} ${assessment.year}`);
        if (await existingAssessment.isVisible()) {
          console.log(`Assessment for ${assessment.quarter} ${assessment.year} already exists, skipping...`);
          
        }
        
        // Year and quarter are now selected by default (previous quarter)
        // No need to select them manually
        
        // Start assessment
        await page.click('button:has-text("Start Assessment")');
        
        // Fill in rating question (1-5 scale)
        const ratingButtons = page.locator('button').filter({ hasText: /^[1-5]$/ });
        await ratingButtons.nth(assessment.rating - 1).click();
        
        // Click Next
        await page.click('button:has-text("Next")');
        
        // Fill in achievements question
        await page.fill('textarea', assessment.achievements);
        await page.click('button:has-text("Next")');
        
        // Fill in improvements question
        await page.fill('textarea', assessment.improvements);
        await page.click('button:has-text("Next")');
        
        // Fill in satisfaction question
        await page.click(`input[value="${assessment.satisfaction}"]`);
        await page.click('button:has-text("Next")');
        
        // Fill in aspirations question
        await page.waitForSelector('textarea', { timeout: 5000 });
        await page.fill('textarea', assessment.aspirations);
        await page.click('button:has-text("Next")');
        
        // Fill in team changes question (final question)
        await page.waitForSelector('textarea', { timeout: 5000 });
        await page.fill('textarea', assessment.teamChanges);
        
        // Submit assessment
        await page.click('button:has-text("Submit Assessment")');
        
        // Verify success
        await page.waitForSelector('#self-assessment-title', { timeout: 10000 });
        console.log(`Successfully submitted assessment for ${assessment.username} - ${assessment.quarter} ${assessment.year}`);
         
  }

  // Clean up any remaining test users after all tests
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, userPattern);
    await page.close();
  });
}); 