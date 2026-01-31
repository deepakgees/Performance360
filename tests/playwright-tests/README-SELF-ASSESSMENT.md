# Self-Assessment Testing with Excel Data

This document explains how to use the self-assessment Playwright tests that can read data from Excel files.

## Overview

The self-assessment tests allow you to:
- Read assessment data from Excel files
- Automatically fill out self-assessment forms
- Test multiple assessment scenarios
- Validate assessment data structure
- Handle Excel file errors gracefully

## Setup

### 1. Install Dependencies

```bash
cd tests/playwright-tests
npm install
```

### 2. Create Excel Template

Generate the Excel template with sample data:

```bash
npm run create-excel-template
```

This creates `tests/assessment-data.xlsx` with sample assessment data.

### 3. Customize Excel Data

Open `tests/assessment-data.xlsx` and modify the data as needed:

| Column | Description | Format | Example |
|--------|-------------|--------|---------|
| Quarter | Assessment quarter | Q1, Q2, Q3, Q4 | Q1 |
| Year | Assessment year | 4-digit year | 2024 |
| Rating | Self-rating | 1-5 scale | 4 |
| Achievements | Key achievements | Text | "Completed major feature implementation" |
| Improvements | Areas for improvement | Text | "Need to improve documentation" |
| Satisfaction | Work satisfaction | Text | "Very Satisfied" |
| Team Changes | Suggestions for team | Text | "Implement better code review" |

## Running Tests

### Basic Test Execution

```bash
# Run all self-assessment tests
npm run test:self-assessment

# Run with browser visible
npm run test:self-assessment:headed

# Run with debug mode
npm run test:self-assessment --debug
```

### Test Scenarios

The tests cover the following scenarios:

1. **Page Display Test**: Verifies the self-assessment page loads correctly
2. **Assessment Creation**: Creates new assessments using Excel data
3. **Assessment Completion**: Fills out and submits complete assessments
4. **Existing Assessments**: Views and validates existing assessments
5. **Multiple Assessments**: Handles multiple assessment entries from Excel
6. **Data Validation**: Validates Excel data structure and format
7. **Error Handling**: Gracefully handles Excel file errors

## Excel Data Structure

### Required Columns

The Excel file must contain these columns:

```javascript
{
  Quarter: 'Q1',           // Q1, Q2, Q3, Q4
  Year: '2024',            // 4-digit year
  Rating: 4,               // 1-5 scale
  Achievements: 'Text...', // Key achievements
  Improvements: 'Text...', // Areas for improvement
  Satisfaction: 'Very Satisfied', // Satisfaction level
  'Team Changes': 'Text...' // Team improvement suggestions
}
```

### Sample Data

```javascript
[
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
  }
]
```

## Test Functions

### `readAssessmentDataFromExcel(filePath)`

Reads assessment data from an Excel file:

```javascript
const assessmentData = readAssessmentDataFromExcel('path/to/file.xlsx');
```

**Features:**
- Automatically falls back to sample data if file not found
- Handles various column name formats
- Validates data structure
- Returns array of assessment objects

### `createSampleExcelFile(filePath)`

Creates an Excel file with sample data:

```javascript
createSampleExcelFile('assessment-data.xlsx');
```

### `validateAssessmentData(data)`

Validates assessment data structure:

```javascript
validateAssessmentData(assessmentData);
```

**Validations:**
- Required columns present
- Quarter format (Q1-Q4)
- Year format (4 digits)
- Rating range (1-5)
- Non-empty text fields

## Error Handling

The tests include robust error handling:

1. **Missing Excel File**: Falls back to sample data
2. **Invalid Data**: Logs warnings and continues with valid data
3. **Network Errors**: Retries and handles timeouts
4. **UI Changes**: Uses flexible selectors

## Customization

### Adding New Assessment Fields

To add new assessment fields:

1. Update the Excel template with new columns
2. Modify `SAMPLE_ASSESSMENT_DATA` in the test file
3. Update the `readAssessmentDataFromExcel` function
4. Add corresponding test steps

### Modifying Test Logic

The test structure is modular:

```javascript
// Custom assessment completion logic
test('custom assessment flow', async ({ page }) => {
  const assessment = assessmentData[0];
  
  // Custom test steps here
  await page.goto('/self-assessment');
  // ... your custom logic
});
```

### Adding New Test Scenarios

Create new test scenarios by following the existing pattern:

```javascript
test('new scenario', async ({ page }) => {
  // Setup
  await page.goto('/self-assessment');
  
  // Action
  // ... your test steps
  
  // Assertion
  await expect(page.locator('#element')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

1. **Excel File Not Found**
   - Run `npm run create-excel-template`
   - Check file path in test

2. **Test Failures**
   - Verify Excel data format
   - Check UI element selectors
   - Ensure app is running

3. **Data Validation Errors**
   - Check column names match exactly
   - Verify data types (rating should be number)
   - Ensure required fields are present

### Debug Mode

Run tests in debug mode for detailed logging:

```bash
npm run test:self-assessment --debug
```

## Integration with CI/CD

The tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Self-Assessment Tests
  run: |
    cd tests/playwright-tests
    npm install
    npm run create-excel-template
    npm run test:self-assessment
```

## Best Practices

1. **Data Management**
   - Keep Excel files in version control
   - Use descriptive file names
   - Document data structure changes

2. **Test Organization**
   - Group related tests together
   - Use descriptive test names
   - Add comments for complex logic

3. **Maintenance**
   - Update tests when UI changes
   - Validate Excel data regularly
   - Monitor test performance

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test logs for error details
3. Validate Excel data structure
4. Ensure app is running correctly 