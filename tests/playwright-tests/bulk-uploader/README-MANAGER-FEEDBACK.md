# Manager Feedback Bulk Upload

This directory contains scripts for bulk uploading manager feedback data from Excel files.

## Files

- `manager-feedback-bulk.js` - Main bulk upload script for manager feedback
- `create-manager-feedback-template.js` - Script to create Excel template with sample data
- `README-MANAGER-FEEDBACK.md` - This documentation file

## Setup

1. **Install dependencies** (if not already installed):
   ```bash
   cd tests/playwright-tests
   npm install
   ```

2. **Create Excel template**:
   ```bash
   node bulk-uploader/create-manager-feedback-template.js
   ```
   This will create `tests/manager-feedback-data.xlsx` with sample data and instructions.

3. **Prepare your data**:
   - Open the generated Excel file
   - Replace the sample data with your actual manager feedback data
   - Ensure all required fields are filled
   - Save the file

## Excel Template Structure

The template includes two sheets:

### 1. Manager Feedback Data
Contains the actual data with the following columns:

#### Basic Information
- `Username` - Employee email address for login
- `Password` - Employee password for login
- `Quarter` - Feedback quarter (Q1, Q2, Q3, Q4)
- `Year` - Feedback year (e.g., 2024)
- `IsAnonymous` - Whether feedback is anonymous (true/false)

#### Manager Satisfaction
- `ManagerSatisfaction` - Overall satisfaction level
  - Options: Very Satisfied, Somewhat Satisfied, Neither satisfied nor dissatisfied, Somewhat dissatisfied, Very dissatisfied
- `ManagerOverallRating` - Overall rating on 1-5 scale

#### Manager Areas Ratings (1-5 scale)
- `ClarityGoals` - Rating for clarity around goals
- `LeadershipStyle` - Rating for leadership style
- `CareerGrowth` - Rating for career growth
- `CoachingCaring` - Rating for coaching and caring
- `TeamMorale` - Rating for team morale
- `WorkLifeBalance` - Rating for work-life balance

**Options for Manager Areas**: Poor, Below average, Average, Above average, Excellent

#### Leadership Style Ratings (1-5 scale)
- `AdvocatesEmployees` - Advocates for their employees
- `RespectsEmployees` - Respects their direct employees
- `ClearInstructions` - Gives clear instructions when assigning tasks
- `AlwaysAvailable` - Always makes themselves available when needed
- `PraisesEmployees` - Praises employees when they perform well
- `PositiveAttitude` - Always has a positive attitude when met with challenges
- `PatienceDiscussions` - Has patience for lengthy discussions

**Options for Leadership Style**: Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree

#### Career Growth Ratings (1-5 scale)
- `SatisfiedCareerGrowth` - I'm satisfied with my current career growth
- `DedicatedDevelopment` - My manager is dedicated to my professional development
- `SatisfiedOpportunities` - I'm satisfied with the opportunities for me to apply my talents and expertise
- `SatisfiedTraining` - I'm satisfied with the job-related training my organization offers
- `SufficientOpportunity` - I have sufficient opportunity to grow in my career

**Options for Career Growth**: Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree

#### Coaching and Caring Ratings (1-5 scale)
- `RespectsIdeas` - Respects my ideas
- `MakesComfortable` - Makes me feel comfortable
- `EncouragesThinking` - Encourages me to think outside the box
- `ShowsGrowthMindset` - Shows growth mindset
- `SupportsIdeas` - Supports my ideas
- `SharesResources` - Shares useful resources

**Options for Coaching and Caring**: Strongly disagree, Disagree, Neither agree nor disagree, Agree, Strongly agree

#### Additional Feedback
- `AdditionalFeedback` - Any other feedback about the manager

**Options for Additional Feedback**: Any text (optional)

### 2. Instructions
Contains detailed descriptions of each field, whether it's required, and valid options.

## Usage

### Prerequisites
1. Ensure the application is running:
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   
   # Terminal 2: Start frontend
   cd frontend
   npm start
   ```

2. Ensure you have test users in the database with the credentials specified in your Excel file.

### Running the Bulk Upload

```bash
cd playwright-tests
node bulk-uploader/manager-feedback-bulk.js
```

The script will:
1. Read the Excel file from `tests/manager-feedback-data.xlsx`
2. Process each row as a separate manager feedback submission
3. Login as each user
4. Navigate to the manager feedback page
5. Fill in all the form fields based on the Excel data
6. Submit the feedback
7. Logout and move to the next user

### Configuration Options

You can modify the script behavior by editing `manager-feedback-bulk.js`:

- **Headless mode**: Change `headless: false` to `headless: true` for background execution
- **Speed**: Adjust `slowMo: 1000` to control the speed of actions (lower = faster)
- **File path**: Modify the `excelFilePath` variable to use a different Excel file

## Error Handling

The script includes error handling for:
- Missing Excel file
- Invalid data in Excel file
- Login failures
- Form submission errors
- Network timeouts

If an error occurs for a specific user, the script will log the error and continue with the next user.

## Sample Data

The template includes two sample entries:
1. **Positive feedback**: High ratings across all categories
2. **Neutral feedback**: Average ratings across all categories

You can use these as examples when creating your own data.

## Validation

The script validates:
- Required fields are present
- Rating values are within valid ranges
- Login credentials are correct
- Feedback doesn't already exist for the same period

## Troubleshooting

### Common Issues

1. **Login fails**: Check that the username/password in the Excel file match existing users
2. **Form not found**: Ensure the application is running and accessible at `http://localhost:3000`
3. **Excel file not found**: Run the template creation script first
4. **Invalid ratings**: Check that rating values match the exact options listed in the instructions

### Debug Mode

For debugging, you can:
- Set `headless: false` to see the browser actions
- Increase `slowMo` to slow down the automation
- Add `console.log` statements to track progress

## Notes

- The script automatically handles anonymous vs non-anonymous feedback
- Duplicate feedback for the same period will be skipped
- The script waits for page loads and form submissions
- All form fields are filled programmatically based on Excel data
- The script logs progress and errors for monitoring 