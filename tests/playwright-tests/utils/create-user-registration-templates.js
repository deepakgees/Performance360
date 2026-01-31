/**
 * User Registration Template Generator
 * 
 * This script creates Excel and CSV files with sample user registration data
 * that can be used with the bulk user registration Playwright tests.
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Sample user registration data structure
const SAMPLE_USER_DATA = [
  {
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@company.com',
    Password: 'Password@123',
    Role: 'EMPLOYEE',
    Department: 'Engineering',
    Position: 'Software Developer'
  },
  {
    FirstName: 'Jane',
    LastName: 'Smith',
    Email: 'jane.smith@company.com',
    Password: 'Password@123',
    Role: 'MANAGER',
    Department: 'Engineering',
    Position: 'Engineering Manager'
  },
  {
    FirstName: 'Mike',
    LastName: 'Johnson',
    Email: 'mike.johnson@company.com',
    Password: 'Password@123',
    Role: 'EMPLOYEE',
    Department: 'Marketing',
    Position: 'Marketing Specialist'
  },
  {
    FirstName: 'Sarah',
    LastName: 'Wilson',
    Email: 'sarah.wilson@company.com',
    Password: 'Password@123',
    Role: 'ADMIN',
    Department: 'HR',
    Position: 'HR Manager'
  },
  {
    FirstName: 'David',
    LastName: 'Brown',
    Email: 'david.brown@company.com',
    Password: 'Password@123',
    Role: 'EMPLOYEE',
    Department: 'Sales',
    Position: 'Sales Representative'
  },
  {
    FirstName: 'Emily',
    LastName: 'Davis',
    Email: 'emily.davis@company.com',
    Password: 'Password@123',
    Role: 'MANAGER',
    Department: 'Marketing',
    Position: 'Marketing Manager'
  },
  {
    FirstName: 'Robert',
    LastName: 'Miller',
    Email: 'robert.miller@company.com',
    Password: 'Password@123',
    Role: 'EMPLOYEE',
    Department: 'Finance',
    Position: 'Financial Analyst'
  },
  {
    FirstName: 'Lisa',
    LastName: 'Garcia',
    Email: 'lisa.garcia@company.com',
    Password: 'Password@123',
    Role: 'ADMIN',
    Department: 'IT',
    Position: 'IT Director'
  }
];

/**
 * Create Excel file with user registration data
 * @param {string} outputPath - Path where to save the Excel file
 */
function createExcelTemplate(outputPath) {
  try {
    // Create new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(SAMPLE_USER_DATA);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Registration Data');
    
    // Write file
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`✅ Excel template created successfully at: ${outputPath}`);
    console.log(`👥 Template contains ${SAMPLE_USER_DATA.length} sample user entries`);
    console.log(`📋 Columns: ${Object.keys(SAMPLE_USER_DATA[0]).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error creating Excel template:', error);
    process.exit(1);
  }
}

/**
 * Create CSV file with user registration data
 * @param {string} outputPath - Path where to save the CSV file
 */
function createCSVTemplate(outputPath) {
  try {
    const headers = Object.keys(SAMPLE_USER_DATA[0]);
    const csvContent = [
      headers.join(','),
      ...SAMPLE_USER_DATA.map(user => 
        headers.map(header => user[header]).join(',')
      )
    ].join('\n');

    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`✅ CSV template created successfully at: ${outputPath}`);
    console.log(`👥 Template contains ${SAMPLE_USER_DATA.length} sample user entries`);
    console.log(`📋 Columns: ${headers.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error creating CSV template:', error);
    process.exit(1);
  }
}

/**
 * Validate user registration data structure
 * @param {Array} data - User data to validate
 */
function validateUserData(data) {
  const requiredFields = ['FirstName', 'LastName', 'Email', 'Password'];
  const validRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
  
  data.forEach((user, index) => {
    // Check for required fields
    requiredFields.forEach(field => {
      if (!user[field] || user[field].trim() === '') {
        console.error(`❌ Missing required field '${field}' in row ${index + 1}`);
      }
    });
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (user.Email && !emailRegex.test(user.Email)) {
      console.error(`❌ Invalid email format in row ${index + 1}: ${user.Email}`);
    }
    
    // Validate password length
    if (user.Password && user.Password.length < 6) {
      console.error(`❌ Password too short in row ${index + 1}: ${user.Password}`);
    }
    
    // Validate role
    if (user.Role && !validRoles.includes(user.Role.toUpperCase())) {
      console.error(`❌ Invalid role in row ${index + 1}: ${user.Role}`);
    }
  });
  
  console.log('✅ User data validation completed');
}

/**
 * Generate unique email addresses for testing
 * @param {string} baseEmail - Base email address
 * @param {number} count - Number of unique emails to generate
 * @returns {Array} Array of unique email addresses
 */
function generateUniqueEmails(baseEmail, count) {
  const emails = [];
  const [localPart, domain] = baseEmail.split('@');
  
  for (let i = 1; i <= count; i++) {
    emails.push(`${localPart}${i}@${domain}`);
  }
  
  return emails;
}

/**
 * Create test data with unique emails
 * @param {number} count - Number of test users to generate
 * @returns {Array} Array of user data with unique emails
 */
function generateTestData(count = 10) {
  const uniqueEmails = generateUniqueEmails('testuser@company.com', count);
  
  return uniqueEmails.map((email, index) => ({
    FirstName: `Test${index + 1}`,
    LastName: 'User',
    Email: email,
    Password: 'Password@123',
    Role: ['EMPLOYEE', 'MANAGER', 'ADMIN'][index % 3],
    Department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'][index % 5],
    Position: 'Test Position'
  }));
}

// Main execution
if (require.main === module) {
  const excelOutputPath = path.join(__dirname, '../tests/user-data.xlsx');
  const csvOutputPath = path.join(__dirname, '../tests/user-data.csv');
  
  console.log('🚀 Creating user registration templates...');
  
  // Create the Excel file
  createExcelTemplate(excelOutputPath);
  
  // Create the CSV file
  createCSVTemplate(csvOutputPath);
  
  // Validate the sample data
  validateUserData(SAMPLE_USER_DATA);
  
  console.log('\n📝 Usage Instructions:');
  console.log('1. Excel and CSV files have been created with sample data');
  console.log('2. You can modify the data in the files as needed');
  console.log('3. Run the bulk registration tests with: npm run test:user-registration-bulk');
  console.log('4. The tests will automatically read these files');
  console.log('5. For testing with unique emails, use the generateTestData() function');
  
  console.log('\n📊 Sample Data Structure:');
  console.log('| FirstName | LastName | Email | Password | Role | Department | Position |');
  console.log('|-----------|----------|-------|----------|------|------------|----------|');
  SAMPLE_USER_DATA.slice(0, 3).forEach(user => {
    console.log(`| ${user.FirstName} | ${user.LastName} | ${user.Email} | ${user.Password} | ${user.Role} | ${user.Department} | ${user.Position} |`);
  });
}

module.exports = {
  createExcelTemplate,
  createCSVTemplate,
  validateUserData,
  generateTestData,
  generateUniqueEmails,
  SAMPLE_USER_DATA
}; 