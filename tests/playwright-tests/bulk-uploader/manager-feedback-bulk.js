const { chromium } = require('playwright');
const { seedDatabase } = require('../../backend/scripts/seed-database');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Read Excel file and return manager feedback data
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} Array of manager feedback data objects
 */
function readManagerFeedbackDataFromExcel(filePath) {
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
      managerSatisfaction: row.ManagerSatisfaction || row.managerSatisfaction || 'Very Satisfied',
      managerOverallRating: parseInt(row.ManagerOverallRating || row.managerOverallRating) || 4,
      
      // Manager Areas Ratings (1-5 scale: Poor, Below average, Average, Above average, Excellent)
      clarityGoals: row.ClarityGoals || row.clarityGoals || 'Above average',
      leadershipStyle: row.LeadershipStyle || row.leadershipStyle || 'Above average',
      careerGrowth: row.CareerGrowth || row.careerGrowth || 'Above average',
      coachingCaring: row.CoachingCaring || row.coachingCaring || 'Above average',
      teamMorale: row.TeamMorale || row.teamMorale || 'Above average',
      workLifeBalance: row.WorkLifeBalance || row.workLifeBalance || 'Above average',
      
      // Leadership Style Ratings (1-5 scale: Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree)
      advocatesEmployees: row.AdvocatesEmployees || row.advocatesEmployees || 'Agree',
      respectsEmployees: row.RespectsEmployees || row.respectsEmployees || 'Agree',
      clearInstructions: row.ClearInstructions || row.clearInstructions || 'Agree',
      alwaysAvailable: row.AlwaysAvailable || row.alwaysAvailable || 'Agree',
      praisesEmployees: row.PraisesEmployees || row.praisesEmployees || 'Agree',
      positiveAttitude: row.PositiveAttitude || row.positiveAttitude || 'Agree',
      patienceDiscussions: row.PatienceDiscussions || row.patienceDiscussions || 'Agree',
      
      // Career Growth Ratings (1-5 scale: Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree)
      satisfiedCareerGrowth: row.SatisfiedCareerGrowth || row.satisfiedCareerGrowth || 'Agree',
      dedicatedDevelopment: row.DedicatedDevelopment || row.dedicatedDevelopment || 'Agree',
      satisfiedOpportunities: row.SatisfiedOpportunities || row.satisfiedOpportunities || 'Agree',
      satisfiedTraining: row.SatisfiedTraining || row.satisfiedTraining || 'Agree',
      sufficientOpportunity: row.SufficientOpportunity || row.sufficientOpportunity || 'Agree',
      
      // Coaching and Caring Ratings (1-5 scale: Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree)
      respectsIdeas: row.RespectsIdeas || row.respectsIdeas || 'Agree',
      makesComfortable: row.MakesComfortable || row.makesComfortable || 'Agree',
      encouragesThinking: row.EncouragesThinking || row.encouragesThinking || 'Agree',
      showsGrowthMindset: row.ShowsGrowthMindset || row.showsGrowthMindset || 'Agree',
      supportsIdeas: row.SupportsIdeas || row.supportsIdeas || 'Agree',
      sharesResources: row.SharesResources || row.sharesResources || 'Agree',

      //appreciation and improvement areas
      appreciation: row.Appreciation || row.appreciation || '',
      improvementAreas: row.ImprovementAreas || row.improvementAreas || '',
    }));
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

/**
 * Main function to handle bulk manager feedback uploads
 */
async function runBulkManagerFeedback() {
  let browser;
  let page;
  

    console.log('Starting bulk manager feedback upload...');
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down actions for better visibility
    });
    
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Read feedback data from Excel file
    const excelFilePath = path.join(__dirname, './manager-feedback-data.xlsx');
    const feedbackData = readManagerFeedbackDataFromExcel(excelFilePath);
    
    if (feedbackData.length === 0) {
      console.log('No manager feedback data found. Please check the Excel file.');
      return;
    }
    
    console.log(`Found ${feedbackData.length} manager feedback entries to process.`);
    
    // Process each feedback
    for (let i = 0; i < feedbackData.length; i++) {
      const feedback = feedbackData[i];
      console.log(`Processing manager feedback ${i + 1}/${feedbackData.length} for user: ${feedback.username}`);
      

        // Navigate to login page
        await page.goto('http://localhost:3000/login');
        
        // Login
        await page.fill('#login-email', feedback.username);
        await page.fill('#login-password', feedback.password.toString());
        await page.click('#login-submit-button');
        
        // Wait for login to complete
        await page.waitForSelector('#logout-button', { timeout: 10000 });
        console.log(`Successfully logged in as ${feedback.username}`);
        
        // Navigate to manager feedback page
        await page.goto('http://localhost:3000/manager-feedback');
        await page.click('#create-manager-feedback-tab');
        
        // Check if feedback already exists for this period
        const existingFeedback = page.locator(`text=${feedback.quarter} ${feedback.year}`);
        if (await existingFeedback.isVisible()) {
          console.log(`Manager feedback for ${feedback.quarter} ${feedback.year} already exists, skipping...`);
          continue;
        }
        
        // Year and quarter are now selected by default (previous quarter)
        // No need to select them manually
        
        // Set manager satisfaction
        await page.click(`input[value="${feedback.managerSatisfaction}"]`);
        
        // Fill leadership style ratings
        const leadershipStatements = [
          { field: 'advocatesEmployees', label: 'Advocates for their employees' },
          { field: 'respectsEmployees', label: 'Respects their direct employees' },
          { field: 'clearInstructions', label: 'Gives clear instructions when assigning tasks' },
          { field: 'alwaysAvailable', label: 'Always makes themselves available when needed' },
          { field: 'praisesEmployees', label: 'Praises employees when they perform well' },
          { field: 'positiveAttitude', label: 'Always has a positive attitude when met with challenges' },
          { field: 'patienceDiscussions', label: 'Has patience for lengthy discussions' }
        ];
        
        for (const statement of leadershipStatements) {
          const rating = feedback[statement.field];
          await page.click(`input[name="leadership-${statement.label}"][value="${rating}"]`);
        }
        
        // Fill career growth ratings
        const careerStatements = [
          { field: 'satisfiedCareerGrowth', label: "I'm satisfied with my current career growth." },
          { field: 'dedicatedDevelopment', label: 'My manager is dedicated to my professional development.' },
          { field: 'satisfiedOpportunities', label: "I'm satisfied with the opportunities for me to apply my talents and expertise." },
          { field: 'satisfiedTraining', label: "I'm satisfied with the job-related training my organization offers." },
          { field: 'sufficientOpportunity', label: 'I have sufficient opportunity to grow in my career' }
        ];
        
        for (const statement of careerStatements) {
          const rating = feedback[statement.field];
          await page.click(`input[name="career-${statement.label}"][value="${rating}"]`);
        }
        
        // Fill coaching and caring ratings
        const coachingStatements = [
          { field: 'respectsIdeas', label: 'Respects my ideas' },
          { field: 'makesComfortable', label: 'Makes me feel comfortable' },
          { field: 'encouragesThinking', label: 'Encourages me to think outside the box' },
          { field: 'showsGrowthMindset', label: 'Shows growth mindset' },
          { field: 'supportsIdeas', label: 'Supports my ideas' },
          { field: 'sharesResources', label: 'Shares useful resources' }
        ];
        
        for (const statement of coachingStatements) {
          const rating = feedback[statement.field];
          await page.click(`input[name="coaching-${statement.label}"][value="${rating}"]`);
        }
        
        // Set overall rating
        await page.click(`input[name="managerOverallRating"][value="${feedback.managerOverallRating}"]`);
        
        // Fill appreciation if provided
        if (feedback.appreciation && feedback.appreciation.trim()) {
          await page.fill('#appreciation-textarea', feedback.appreciation);
        }
        
        // Fill improvement areas if provided
        if (feedback.improvementAreas && feedback.improvementAreas.trim()) {
          await page.fill('#improvement-areas-textarea', feedback.improvementAreas);
        }
        
        // Submit feedback
        await page.click('button:has-text("Submit Manager Feedback")');
        
        // Verify success
        await page.waitForSelector('#past-manager-feedback-title', { timeout: 10000 });
        console.log(`Successfully submitted manager feedback for ${feedback.username} - ${feedback.quarter} ${feedback.year}`);
        
        // Wait a moment before next feedback
        await page.waitForTimeout(2000);
        
        // Logout
        await page.click('#logout-button');
        
     
    }
    
    console.log('Bulk manager feedback upload completed!');
    
 
}

// Run the script if called directly
if (require.main === module) {
  runBulkManagerFeedback().catch(console.error);
}

module.exports = { runBulkManagerFeedback, readManagerFeedbackDataFromExcel }; 