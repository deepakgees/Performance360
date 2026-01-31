const { chromium } = require('playwright');
const { seedDatabase } = require('../../backend/scripts/seed-database');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Read Excel file and return colleague feedback data
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} Array of colleague feedback data objects
 */
function readColleagueFeedbackDataFromExcel(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Excel file not found: ${filePath}. Using sample data.`);
      return [];
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data.map(row => ({
      username: row.Username || row.username || 'invalid@msg-global.com',
      password: String(row.Password || row.password || '123456'),
      quarter: row.Quarter || row.quarter || 'Q1',
      year: String(row.Year || row.year || '2024'),
      isAnonymous: row.IsAnonymous === 'true' || row.IsAnonymous === 'TRUE' || false,
      colleagueName: row.ColleagueName || row.colleagueName || 'colleague@msg-global.com',
      appreciation: row.Appreciation || row.appreciation || 'Great teamwork and communication skills.',
      improvement: row.Improvement || row.improvement || 'Could improve time management and documentation.',
      rating: parseInt(row.Rating || row.rating) || 4
    }));
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

/**
 * Main function to handle bulk colleague feedback uploads
 */
async function runBulkColleagueFeedback() {
  let browser;
  let page;
  
  try {
    console.log('Starting bulk colleague feedback upload...');
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down actions for better visibility
    });
    
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Read feedback data from Excel file
    const excelFilePath = path.join(__dirname, './colleague-feedback-data.xlsx');
    const feedbackData = readColleagueFeedbackDataFromExcel(excelFilePath);
    
    if (feedbackData.length === 0) {
      console.log('No colleague feedback data found. Please check the Excel file.');
      return;
    }
    
    console.log(`Found ${feedbackData.length} colleague feedback entries to process.`);
    
    // Process each feedback
    for (let i = 0; i < feedbackData.length; i++) {
      const feedback = feedbackData[i];
      
      console.log(`Processing colleague feedback ${i + 1}/${feedbackData.length}`);
      console.log(feedback);

        // Navigate to login page
        await page.goto('http://localhost:3000/login');
        
        // Login
        await page.fill('#login-email', feedback.username);
        await page.fill('#login-password', feedback.password.toString());
        await page.click('#login-submit-button');
        
        // Wait for login to complete
        await page.waitForSelector('#logout-button', { timeout: 10000 });
        console.log(`Successfully logged in as ${feedback.username}`);
        
        // Navigate to colleague feedback page
        await page.goto('http://localhost:3000/colleague-feedback');
        await page.click('#create-feedback-tab');
        
        // Check if feedback already exists for this period and recipient
        const existingFeedback = page.locator(`text=${feedback.quarter} ${feedback.year}`);
        if (await existingFeedback.isVisible()) {
          console.log(`Colleague feedback for ${feedback.quarter} ${feedback.year} already exists, skipping...`);
          continue;
        }
        
        // Set anonymous checkbox if needed
        if (feedback.isAnonymous) {
          await page.check('#anonymous-checkbox');
        }
        
        // Select recipient by email
        await page.selectOption('#recipient-select', { label: feedback.colleagueName });
        
        // Year and quarter are now selected by default (previous quarter)
        // No need to select them manually
        
        // Fill appreciation text
        await page.fill('#appreciation-textarea', feedback.appreciation);
        
        // Fill improvement text
        await page.fill('#improvement-textarea', feedback.improvement);
        
        // Set rating
        await page.click(`#rating-button-${feedback.rating}`);
        
        // Submit feedback
        await page.click('button:has-text("Submit Colleague Feedback")');
        
        // Verify success
        await page.waitForSelector('#view-feedback-tab', { timeout: 10000 });
        console.log(`Successfully submitted colleague feedback for ${feedback.username} - ${feedback.quarter} ${feedback.year}`);
        
        // Wait a moment before next feedback
        await page.waitForTimeout(2000);
        
        // Logout
        await page.click('#logout-button');
        
     
    }
    
    console.log('Bulk colleague feedback upload completed!');
    
  } catch (error) {
    console.error('Error during bulk upload:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  runBulkColleagueFeedback().catch(console.error);
}

module.exports = { runBulkColleagueFeedback, readColleagueFeedbackDataFromExcel }; 