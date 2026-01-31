const { test, expect } = require('@playwright/test');
const { assignManagerToEmployee, deleteUsersByPattern, generateTestUserData, registerAndLoginUserViaUI, registerUserWithRole, loginUser } = require('../../utils/test-helpers');

const senderUserPattern = 'feedbacksenderemployee';
const receiverUserPattern = 'feedbackreceivingmanager';

// Generate unique test data using helper function
const senderEmployeeData = generateTestUserData(senderUserPattern, 'Sender', 'Employee', 'Password@123');
const receiverManagerData = generateTestUserData(receiverUserPattern, 'Receiver', 'Manager', 'Password@123');

// Sample manager feedback data
const managerFeedbackData = {
  year: 2025,
  quarter: 'Q1 (January - March)',
  satisfaction: 'Very Satisfied',
  leadershipStyle: {
    'Advocates for their employees': 'Strongly agree',
    'Respects their direct employees': 'Agree',
    'Gives clear instructions when assigning tasks': 'Strongly agree',
    'Always makes themselves available when needed': 'Agree',
    'Praises employees when they perform well': 'Strongly agree',
    'Always has a positive attitude when met with challenges': 'Agree',
    'Has patience for lengthy discussions':'Agree'
  },
  careerGrowth: {
    "I'm satisfied with my current career growth.": 'Agree',
    'My manager is dedicated to my professional development.': 'Strongly agree',
    "I'm satisfied with the opportunities for me to apply my talents and expertise.": 'Agree',
    "I'm satisfied with the job-related training my organization offers.": 'Agree',
    'I have sufficient opportunity to grow in my career': 'Strongly agree'
  },
  coachingCaring: {
    'Respects my ideas': 'Strongly agree',
    'Makes me feel comfortable': 'Agree',
    'Encourages me to think outside the box': 'Agree',
    'Shows growth mindset': 'Strongly agree',
    'Supports my ideas': 'Agree',
    'Shares useful resources': 'Strongly agree'
  },
  overallRating: 5
};

test.describe('Manager feedback tests', () => {

  test('Should be able to submit a manager feedback successfully', async ({ page }) => {
    // Register and create manager user
    const managerResult = await registerUserWithRole(page, receiverManagerData, 'MANAGER');
    console.log("Manager user created: ", managerResult);
    
    // Register and create employee user
    const employeeResult = await registerUserWithRole(page, senderEmployeeData, 'EMPLOYEE');    
    console.log("Employee user created: ", employeeResult);
    
    // Wait for user to be fully available in the system
    await page.waitForTimeout(2000);
      
    //assign manager to employee
    await assignManagerToEmployee(page, employeeResult.id, managerResult.id);
    
    // Wait for manager assignment to be processed
    await page.waitForTimeout(1000);

    //login as employee  
    await loginUser(page, employeeResult.email, employeeResult.password);
    
    // Navigate to manager feedback page
    await page.goto('/manager-feedback');

    // Click create new feedback tab
    await page.click('#create-manager-feedback-tab');

    // Fill in feedback form
    // Year and quarter are now selected by default (previous quarter)
    // No need to select them manually
    
    // Select satisfaction level
    await page.click(`#satisfaction-${managerFeedbackData.satisfaction.toLowerCase().replace(/\s+/g, '-')}`);

    // Fill in leadership style ratings
    for (const [statement, rating] of Object.entries(managerFeedbackData.leadershipStyle)) {
      await page.click(`input[name="leadership-${statement}"][value="${rating}"]`);
    }

    // Fill in career growth ratings
    for (const [statement, rating] of Object.entries(managerFeedbackData.careerGrowth)) {
      await page.click(`input[name="career-${statement}"][value="${rating}"]`);
    }

    // Fill in coaching and caring ratings
    for (const [statement, rating] of Object.entries(managerFeedbackData.coachingCaring)) {
      await page.click(`input[name="coaching-${statement}"][value="${rating}"]`);
    }

    // Select overall rating
    await page.click(`input[name="managerOverallRating"][value="${managerFeedbackData.overallRating}"]`);
    
    // Submit feedback  
    await page.click('button:has-text("Submit Manager Feedback")');
    
    // Wait for success message to appear
    await page.waitForSelector('[data-testid="success-notification"]', { timeout: 10000 });

  });

  // Clean up any remaining test users after all tests
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteUsersByPattern(page, senderUserPattern);
    await deleteUsersByPattern(page, receiverUserPattern);
    await page.close();
  });
}); 