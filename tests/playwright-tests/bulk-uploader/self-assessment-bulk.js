const { chromium } = require('playwright');
const { seedDatabase } = require('../../backend/scripts/seed-database');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Read Excel file and return assessment data
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} Array of assessment data objects
 */
function readAssessmentDataFromExcel(filePath) {
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
      rating: parseInt(row.Rating || row.rating) || 4,
      achievements: row.Achievements || row.achievements || 'Sample achievements',
      improvements: row.Improvements || row.improvements || 'Sample improvements',
      satisfaction: row.Satisfaction || row.satisfaction || 'Very Satisfied',
      aspirations: row.Aspirations || row.aspirations || 'Sample career aspirations',
      teamChanges: row.TeamChanges || row.teamChanges || row['Team Changes'] || 'Sample team changes',
    }));
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

/**
 * Main function to handle bulk self-assessment uploads
 */
async function runBulkSelfAssessment() {
  let browser;
  let page;
  
  try {
    console.log('Starting bulk self-assessment upload...');
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down actions for better visibility
    });
    
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Read assessment data from Excel file
    const excelFilePath = path.join(__dirname, './self-assessment-data.xlsx');
    const assessmentData = readAssessmentDataFromExcel(excelFilePath);
    
    if (assessmentData.length === 0) {
      console.log('No assessment data found. Please check the Excel file.');
      return;
    }
    
    console.log(`Found ${assessmentData.length} assessment entries to process.`);
    
    // Process each assessment
    for (let i = 0; i < assessmentData.length; i++) {
      const assessment = assessmentData[i];
      console.log(`Processing assessment ${i + 1}/${assessmentData.length} for user: ${assessment.username}`);
      
      try {
        // Navigate to login page
        await page.goto('http://localhost:3000/login');
        
        // Login
        await page.fill('#login-email', assessment.username);
        await page.fill('#login-password', assessment.password.toString());
        await page.click('#login-submit-button');
        
        // Wait for login to complete
        await page.waitForSelector('#logout-button', { timeout: 10000 });
        console.log(`Successfully logged in as ${assessment.username}`);
        
        // Navigate to self-assessment page
        await page.goto('http://localhost:3000/self-assessment');
        await page.click('#create-assessment-tab');
        
        // Check if assessment already exists for this period
        const existingAssessment = page.locator(`text=${assessment.quarter} ${assessment.year}`);
        if (await existingAssessment.isVisible()) {
          console.log(`Assessment for ${assessment.quarter} ${assessment.year} already exists, skipping...`);
          continue;
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
        
        // Wait a moment before next assessment
        await page.waitForTimeout(2000);
        
        // Logout
        await page.click('#logout-button');
        
      } catch (error) {
        console.error(`Error processing assessment for ${assessment.username}:`, error.message);
        // Continue with next assessment
      }
    }
    
    console.log('Bulk self-assessment upload completed!');
    
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
  runBulkSelfAssessment().catch(console.error);
}

module.exports = { runBulkSelfAssessment, readAssessmentDataFromExcel }; 