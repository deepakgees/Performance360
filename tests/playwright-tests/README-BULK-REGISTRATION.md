# Bulk User Registration Testing with Excel/CSV Data

This document explains how to use the bulk user registration Playwright tests that can read data from Excel or CSV files.

## Overview

The bulk user registration tests allow you to:
- Read user registration data from Excel or CSV files
- Automatically register multiple users through the UI
- Test different user roles (EMPLOYEE, MANAGER, ADMIN)
- Validate registration data structure
- Handle file errors gracefully
- Test form validation and error scenarios

## Setup

### 1. Install Dependencies

```bash
cd tests/playwright-tests
npm install
```

### 2. Create User Registration Templates

Generate Excel and CSV templates with sample user data:

```bash
npm run create-user-templates
```

This creates:
- `tests/user-data.xlsx` - Excel file with sample user data
- `tests/user-data.csv` - CSV file with sample user data

### 3. Customize User Data

Open the generated files and modify the data as needed:

| Column | Description | Format | Example |
|--------|-------------|--------|---------|
| FirstName | User's first name | Text | "John" |
| LastName | User's last name | Text | "Doe" |
| Email | User's email address | Valid email | "john.doe@company.com" |
| Password | User's password | Min 6 characters | "Password@123" |
| Role | User's role | EMPLOYEE/MANAGER/ADMIN | "EMPLOYEE" |
| Department | User's department | Text | "Engineering" |
| Position | User's position | Text | "Software Developer" |

## Running Tests

### Basic Test Execution

```bash
# Run all bulk registration tests
npm run test:user-registration-bulk

# Run with browser visible
npm run test:user-registration-bulk:headed

# Run with debug mode
npm run test:user-registration-bulk --debug
```

### Test Scenarios

The tests cover the following scenarios:

1. **Page Display Test**: Verifies the registration page loads correctly
2. **Single User Registration**: Registers one user using Excel data
3. **Multiple User Registration**: Registers multiple users from Excel data
4. **Duplicate Email Handling**: Tests registration with existing email
5. **Data Validation**: Validates Excel/CSV data structure and format
6. **File Error Handling**: Gracefully handles missing or invalid files
7. **CSV File Support**: Reads data from CSV files
8. **Role-based Registration**: Tests different user roles
9. **Form Validation**: Tests form validation and error scenarios
10. **Loading States**: Verifies loading states during registration

## Data Structure

### Excel/CSV Format

The files should contain these columns:

```javascript
{
  FirstName: 'John',           // User's first name
  LastName: 'Doe',             // User's last name
  Email: 'john@company.com',   // Valid email address
  Password: 'Password@123',     // Min 6 characters
  Role: 'EMPLOYEE',            // EMPLOYEE/MANAGER/ADMIN
  Department: 'Engineering',    // User's department
  Position: 'Developer'        // User's position
}
```

### Sample Data

```javascript
[
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
  }
]
```

## Test Functions

### `readUserDataFromExcel(filePath)`

Reads user registration data from an Excel file:

```javascript
const userData = readUserDataFromExcel('path/to/file.xlsx');
```

**Features:**
- Automatically falls back to sample data if file not found
- Handles various column name formats
- Validates data structure
- Returns array of user objects

### `readUserDataFromCSV(filePath)`

Reads user registration data from a CSV file:

```javascript
const userData = readUserDataFromCSV('path/to/file.csv');
```

### `registerUserViaUI(page, userData)`

Registers a single user through the UI:

```javascript
const success = await registerUserViaUI(page, userData);
```

**Features:**
- Fills registration form automatically
- Handles success/error dialogs
- Returns success status
- Includes error handling

### `validateUserData(userData)`

Validates user registration data:

```javascript
validateUserData(userData);
```

**Validations:**
- Required fields present (FirstName, LastName, Email, Password)
- Valid email format
- Password length (minimum 6 characters)
- Valid role (EMPLOYEE, MANAGER, ADMIN)

## File Support

### Excel Files (.xlsx)

- Supports multiple column name formats
- Automatic fallback to sample data
- Handles various Excel formats

### CSV Files (.csv)

- Comma-separated values
- Header row required
- Simple text format

### Column Name Flexibility

The tests support various column name formats:

```javascript
// Supported formats for First Name
FirstName || firstName || 'First Name'

// Supported formats for Email
Email || email

// Supported formats for Role
Role || role
```

## Error Handling

The tests include robust error handling:

1. **Missing Files**: Falls back to sample data
2. **Invalid Data**: Logs warnings and continues with valid data
3. **Network Errors**: Retries and handles timeouts
4. **UI Changes**: Uses flexible selectors
5. **Duplicate Emails**: Handles existing user errors
6. **Validation Errors**: Tests form validation

## Customization

### Adding New User Fields

To add new user fields:

1. Update the Excel/CSV template with new columns
2. Modify `SAMPLE_USER_DATA` in the test file
3. Update the `readUserDataFromExcel` function
4. Add corresponding test steps

### Modifying Registration Logic

The registration function is modular:

```javascript
// Custom registration logic
async function customRegisterUser(page, userData) {
  await page.goto('/register');
  
  // Custom form filling logic
  await page.fill('#register-first-name', userData.firstName);
  // ... additional custom logic
  
  return success;
}
```

### Adding New Test Scenarios

Create new test scenarios by following the existing pattern:

```javascript
test('custom registration scenario', async ({ page }) => {
  const user = userData[0];
  
  // Setup
  await page.goto('/register');
  
  // Action
  const success = await registerUserViaUI(page, user);
  
  // Assertion
  expect(success).toBe(true);
});
```

## Performance Considerations

### Batch Processing

For large datasets, consider:

```javascript
// Process users in batches
const batchSize = 5;
for (let i = 0; i < userData.length; i += batchSize) {
  const batch = userData.slice(i, i + batchSize);
  
  for (const user of batch) {
    await registerUserViaUI(page, user);
    await page.waitForTimeout(1000); // Delay between registrations
  }
}
```

### Unique Email Generation

For testing with unique emails:

```javascript
const { generateTestData } = require('./utils/create-user-registration-templates');

// Generate 10 unique test users
const testUsers = generateTestData(10);
```

## Troubleshooting

### Common Issues

1. **File Not Found**
   - Run `npm run create-user-templates`
   - Check file path in test

2. **Test Failures**
   - Verify Excel/CSV data format
   - Check UI element selectors
   - Ensure app is running

3. **Data Validation Errors**
   - Check column names match exactly
   - Verify email format
   - Ensure password length ≥ 6 characters

4. **Duplicate Email Errors**
   - Use unique email addresses
   - Check for existing users in database

### Debug Mode

Run tests in debug mode for detailed logging:

```bash
npm run test:user-registration-bulk --debug
```

## Integration with CI/CD

The tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Bulk Registration Tests
  run: |
    cd tests/playwright-tests
    npm install
    npm run create-user-templates
    npm run test:user-registration-bulk
```

## Best Practices

1. **Data Management**
   - Keep Excel/CSV files in version control
   - Use descriptive file names
   - Document data structure changes

2. **Test Organization**
   - Group related tests together
   - Use descriptive test names
   - Add comments for complex logic

3. **Maintenance**
   - Update tests when UI changes
   - Validate data regularly
   - Monitor test performance

4. **Security**
   - Use test-specific email domains
   - Avoid real user data in tests
   - Clean up test data after tests

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test logs for error details
3. Validate Excel/CSV data structure
4. Ensure app is running correctly
5. Check for UI changes that might affect selectors 