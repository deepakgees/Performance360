const { test, expect } = require('@playwright/test');
const { deleteUsersByPattern, generateTestUserData, registerAndLoginUserViaUI, registerUserWithRole } = require('../../utils/test-helpers');

const senderUserPattern = 'sendercolleague';
const receiverUserPattern = 'receivercolleague';

// Generate unique test data using helper function
const senderUserData = generateTestUserData(senderUserPattern, 'Sender', 'Sender', 'Password@123');
const receiverUserData = generateTestUserData(receiverUserPattern, 'Receiver', 'Receiver', 'Password@123');


//sample colleague feedback data
const colleagueFeedbackData = {
  recipient: receiverUserData.firstName + ' ' + receiverUserData.lastName,
  year: 2025,
  quarter: 'Q1 (January - March)',
  appreciation: 'Great work on the project!',
  improvement: 'Work on project planning!',
  rating: 5,
  workAgain: 'yes'
};

test.describe('Colleague feedback tests ', () => {

  test('Should be able to submit a colleague feedback successfully', async ({ page }) => {
    // Register receiver user via API first
    const receiverUser = await registerUserWithRole(page, receiverUserData);
    console.log(`[TEST] Receiver user created: ${receiverUser.email} (ID: ${receiverUser.id})`);
    
    // Wait a moment to ensure the user is fully created and available in the system
    // This helps avoid race conditions where the user might not appear in dropdowns yet
    // The database needs time to commit the transaction and make the user available
    await page.waitForTimeout(2000);

    // Register and login sender user using reusable helper method
    const result = await registerAndLoginUserViaUI(page, senderUserData);    
    // Verify registration and login were successful
    expect(result.success).toBe(true);

     // Navigate to feedback page
    await page.goto('/colleague-feedback');

        // click create new feedback tab
    await page.click('#create-feedback-tab');

    // Wait for the recipient dropdown to be visible
    await page.waitForSelector('#recipient-select', { state: 'visible' });
    
    // Wait for the dropdown to have more than just the default "Select a colleague" option
    // This ensures the users have been loaded from the API
    await page.waitForFunction(
      () => {
        const select = document.querySelector('#recipient-select');
        if (!select) return false;
        return select.options.length > 1; // More than just the default option
      },
      { timeout: 10000 }
    );
    
    // Wait for the receiver user to appear in the dropdown options
    // The dropdown loads users asynchronously, so we need to wait for the specific option
    const recipientName = receiverUserData.firstName + ' ' + receiverUserData.lastName;
    console.log(`[TEST] Waiting for recipient "${recipientName}" to appear in dropdown...`);
    
    await page.waitForFunction(
      (name) => {
        const select = document.querySelector('#recipient-select');
        if (!select) return false;
        const options = Array.from(select.options);
        const found = options.some(option => option.textContent.trim() === name);
        if (!found) {
          console.log(`[TEST] Available options: ${options.map(o => o.textContent.trim()).join(', ')}`);
        }
        return found;
      },
      recipientName,
      { timeout: 15000 }
    );
    
    console.log(`[TEST] Recipient "${recipientName}" found in dropdown, proceeding with selection...`);

    // Fill in feedback form
    //select receiver user from recipient dropdown    
    await page.selectOption('#recipient-select', { label: recipientName });    

    // Year and quarter are now selected by default (previous quarter)
    // No need to select them manually
    
    //fill appreciation textarea
    await page.fill('#appreciation-textarea', colleagueFeedbackData.appreciation);

    //fill improvement textarea
    await page.fill('#improvement-textarea', colleagueFeedbackData.improvement);

        //select 5 as rating  
    await page.click('#rating-button-' + colleagueFeedbackData.rating);

    //select Yes for work again
    await page.click('#work-again-' + colleagueFeedbackData.workAgain);
    
    // Submit feedback  
      await page.click('#submit-feedback-button');
    
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