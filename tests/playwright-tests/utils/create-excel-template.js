/**
 * Excel Template Generator for Self-Assessment Tests
 * 
 * This script creates an Excel file with sample assessment data
 * that can be used with the self-assessment Playwright tests.
 */

const XLSX = require('xlsx');
const path = require('path');

// Sample assessment data structure
const SAMPLE_ASSESSMENT_DATA = [
  {
    Quarter: 'Q1',
    Year: '2024',
    Rating: 4,
    Achievements: 'Completed major feature implementation and mentored junior developers',
    Improvements: 'Need to improve documentation practices and time management',
    Satisfaction: 'Very Satisfied',
    'Team Changes': 'Implement better code review process and improve team communication'
  },
  {
    Quarter: 'Q2',
    Year: '2024',
    Rating: 5,
    Achievements: 'Led successful project delivery and improved team productivity',
    Improvements: 'Could enhance presentation skills and take more initiative',
    Satisfaction: 'Very Satisfied',
    'Team Changes': 'Add more training sessions and improve knowledge sharing'
  },
  {
    Quarter: 'Q3',
    Year: '2024',
    Rating: 4,
    Achievements: 'Successfully implemented new technologies and mentored team members',
    Improvements: 'Need to work on strategic thinking and long-term planning',
    Satisfaction: 'Somewhat Satisfied',
    'Team Changes': 'Implement better project tracking tools and regular team retrospectives'
  },
  {
    Quarter: 'Q4',
    Year: '2024',
    Rating: 5,
    Achievements: 'Exceeded all performance targets and received recognition',
    Improvements: 'Could improve cross-team collaboration and knowledge sharing',
    Satisfaction: 'Very Satisfied',
    'Team Changes': 'Establish regular cross-team meetings and shared documentation'
  }
];

/**
 * Create Excel file with assessment data
 * @param {string} outputPath - Path where to save the Excel file
 */
function createExcelTemplate(outputPath) {
  try {
    // Create new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ASSESSMENT_DATA);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment Data');
    
    // Write file
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`✅ Excel template created successfully at: ${outputPath}`);
    console.log(`📊 Template contains ${SAMPLE_ASSESSMENT_DATA.length} sample assessment entries`);
    console.log(`📋 Columns: ${Object.keys(SAMPLE_ASSESSMENT_DATA[0]).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error creating Excel template:', error);
    process.exit(1);
  }
}

/**
 * Validate assessment data structure
 * @param {Array} data - Assessment data to validate
 */
function validateAssessmentData(data) {
  const requiredColumns = ['Quarter', 'Year', 'Rating', 'Achievements', 'Improvements', 'Satisfaction', 'Team Changes'];
  
  data.forEach((row, index) => {
    // Check for required columns
    requiredColumns.forEach(column => {
      if (!(column in row)) {
        console.error(`❌ Missing required column '${column}' in row ${index + 1}`);
      }
    });
    
    // Validate data types
    if (row.Quarter && !/^Q[1-4]$/.test(row.Quarter)) {
      console.error(`❌ Invalid quarter format in row ${index + 1}: ${row.Quarter}`);
    }
    
    if (row.Year && !/^\d{4}$/.test(row.Year)) {
      console.error(`❌ Invalid year format in row ${index + 1}: ${row.Year}`);
    }
    
    if (row.Rating && (row.Rating < 1 || row.Rating > 5)) {
      console.error(`❌ Invalid rating in row ${index + 1}: ${row.Rating} (should be 1-5)`);
    }
  });
  
  console.log('✅ Data validation completed');
}

// Main execution
if (require.main === module) {
  const outputPath = path.join(__dirname, '../tests/assessment-data.xlsx');
  
  console.log('🚀 Creating Excel template for self-assessment tests...');
  
  // Create the Excel file
  createExcelTemplate(outputPath);
  
  // Validate the sample data
  validateAssessmentData(SAMPLE_ASSESSMENT_DATA);
  
  console.log('\n📝 Usage Instructions:');
  console.log('1. The Excel file has been created with sample data');
  console.log('2. You can modify the data in the Excel file as needed');
  console.log('3. Run the self-assessment tests with: npm run test:self-assessment');
  console.log('4. The tests will automatically read this Excel file');
}

module.exports = {
  createExcelTemplate,
  validateAssessmentData,
  SAMPLE_ASSESSMENT_DATA
}; 