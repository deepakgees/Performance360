# Bulk Upload Scripts

This directory contains standalone scripts for bulk uploading data using Excel files.

## Files

- `self-assessment-bulk.js` - Standalone script for bulk self-assessment uploads
- `manager-feedback-bulk.js` - Standalone script for bulk manager feedback uploads
- `colleague-feedback-bulk.js` - Standalone script for bulk colleague feedback uploads
- `create-manager-feedback-template.js` - Script to create Excel template for manager feedback
- `create-colleague-feedback-template.js` - Script to create Excel template for colleague feedback
- `README-MANAGER-FEEDBACK.md` - Detailed documentation for manager feedback bulk upload
- `README-COLLEAGUE-FEEDBACK.md` - Detailed documentation for colleague feedback bulk upload

## Self-Assessment Bulk Upload

### Running the Bulk Self-Assessment Uploader

```bash
# From the tests/playwright-tests directory
npm run bulk-self-assessment
```

Or run directly:
```bash
node bulk-uploader/self-assessment-bulk.js
```

### Excel File Format

The script expects an Excel file at `../tests/assessment-data.xlsx` with the following columns:

| Column | Description | Required | Default |
|--------|-------------|----------|---------|
| Username | User's email address | Yes | invalid@msg-global.com |
| Password | User's password | Yes | 123456 |
| Quarter | Assessment quarter (Q1, Q2, Q3, Q4) | Yes | Q1 |
| Year | Assessment year | Yes | 2024 |
| Rating | Self-rating (1-5) | Yes | 4 |
| Achievements | Achievements text | Yes | Sample achievements |
| Improvements | Areas for improvement | Yes | Sample improvements |
| Satisfaction | Job satisfaction level | Yes | Very Satisfied |
| Team Changes | Team changes description | Yes | Sample team changes |

## Manager Feedback Bulk Upload

### Setup

1. **Create Excel template**:
   ```bash
   node bulk-uploader/create-manager-feedback-template.js
   ```

2. **Prepare your data**:
   - Open the generated `tests/manager-feedback-data.xlsx`
   - Replace sample data with your actual manager feedback data
   - Ensure all required fields are filled

### Running the Bulk Manager Feedback Uploader

```bash
node bulk-uploader/manager-feedback-bulk.js
```

### Excel File Format

The manager feedback template includes comprehensive fields for:
- Basic information (username, password, quarter, year, anonymous flag)
- Manager satisfaction and overall rating
- Manager areas ratings (6 categories)
- Leadership style ratings (7 statements)
- Career growth ratings (5 statements)
- Coaching and caring ratings (6 statements)

See `README-MANAGER-FEEDBACK.md` for detailed field descriptions and valid options.

## Colleague Feedback Bulk Upload

### Setup

1. **Create Excel template**:
   ```bash
   node bulk-uploader/create-colleague-feedback-template.js
   ```

2. **Prepare your data**:
   - Open the generated `tests/colleague-feedback-data.xlsx`
   - Replace sample data with your actual colleague feedback data
   - Ensure all required fields are filled

### Running the Bulk Colleague Feedback Uploader

```bash
node bulk-uploader/colleague-feedback-bulk.js
```

### Excel File Format

The colleague feedback template includes fields for:
- Basic information (username, password, quarter, year, anonymous flag)
- Recipient email (colleague receiving feedback)
- Appreciation text (what you appreciate about the colleague)
- Improvement text (what the colleague could improve)
- Overall rating (1-5 scale)
- Would work again (true/false)

See `README-COLLEAGUE-FEEDBACK.md` for detailed field descriptions and valid options.

## Common Features

Both scripts include:

- **Automated Login**: Logs in as each user from the Excel file
- **Duplicate Detection**: Skips submissions that already exist for the same period
- **Error Handling**: Continues processing even if one submission fails
- **Progress Logging**: Shows progress for each submission being processed
- **Visual Mode**: Runs with browser visible (can be set to headless)

### Configuration

You can modify the scripts to:
- Change the Excel file path
- Enable/disable headless mode
- Adjust timing delays
- Modify the base URL

### Requirements

- Frontend application running on `http://localhost:3000`
- Backend application running on `http://localhost:5000`
- Excel file with appropriate data
- Valid user credentials in the Excel file

### Error Handling

The scripts will:
- Skip submissions that already exist
- Log errors for failed submissions
- Continue processing remaining submissions
- Provide detailed console output 