# Quick Start Guide - Bulk Upload Utilities

This guide shows you how to quickly set up and use the bulk upload utilities for both manager feedback and colleague feedback.

## 🚀 Quick Setup

### 1. Generate All Templates
```bash
cd tests/playwright-tests
node bulk-uploader/create-all-templates.js
```

This creates:
- `tests/manager-feedback-data.xlsx` - Template for manager feedback
- `tests/colleague-feedback-data.xlsx` - Template for colleague feedback

### 2. Prepare Your Data
1. Open the generated Excel files
2. Replace sample data with your actual feedback data
3. Save the files

### 3. Start Your Application
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm start
```

### 4. Run Bulk Uploads
```bash
# Manager Feedback
cd tests/playwright-tests
node bulk-uploader/manager-feedback-bulk.js

# Colleague Feedback
node bulk-uploader/colleague-feedback-bulk.js
```

## 📋 Excel Template Fields

### Manager Feedback Template
| Field | Description | Required |
|-------|-------------|----------|
| Username | Employee email for login | Yes |
| Password | Employee password | Yes |
| Quarter | Q1, Q2, Q3, Q4 | Yes |
| Year | Feedback year | Yes |
| IsAnonymous | true/false | Yes |
| ManagerSatisfaction | Overall satisfaction level | Yes |
| ManagerOverallRating | 1-5 scale | Yes |
| ClarityGoals | Rating for goals clarity | Yes |
| LeadershipStyle | Rating for leadership | Yes |
| CareerGrowth | Rating for career growth | Yes |
| CoachingCaring | Rating for coaching | Yes |
| TeamMorale | Rating for team morale | Yes |
| WorkLifeBalance | Rating for work-life balance | Yes |
| AdvocatesEmployees | Leadership statement rating | Yes |
| RespectsEmployees | Leadership statement rating | Yes |
| ClearInstructions | Leadership statement rating | Yes |
| AlwaysAvailable | Leadership statement rating | Yes |
| PraisesEmployees | Leadership statement rating | Yes |
| PositiveAttitude | Leadership statement rating | Yes |
| PatienceDiscussions | Leadership statement rating | Yes |
| SatisfiedCareerGrowth | Career growth statement rating | Yes |
| DedicatedDevelopment | Career growth statement rating | Yes |
| SatisfiedOpportunities | Career growth statement rating | Yes |
| SatisfiedTraining | Career growth statement rating | Yes |
| SufficientOpportunity | Career growth statement rating | Yes |
| RespectsIdeas | Coaching statement rating | Yes |
| MakesComfortable | Coaching statement rating | Yes |
| EncouragesThinking | Coaching statement rating | Yes |
| ShowsGrowthMindset | Coaching statement rating | Yes |
| SupportsIdeas | Coaching statement rating | Yes |
| SharesResources | Coaching statement rating | Yes |
| AdditionalFeedback | Any other feedback | No |

### Colleague Feedback Template
| Field | Description | Required |
|-------|-------------|----------|
| Username | Employee email for login | Yes |
| Password | Employee password | Yes |
| Quarter | Q1, Q2, Q3, Q4 | Yes |
| Year | Feedback year | Yes |
| IsAnonymous | true/false | Yes |
| RecipientEmail | Email of colleague receiving feedback | Yes |
| Appreciation | What you appreciate about this colleague | Yes |
| Improvement | What this colleague could improve | Yes |
| Rating | Overall performance rating (1-5) | Yes |
| WouldWorkAgain | Would you work with this colleague again | Yes |

## ⚙️ Configuration Options

### Browser Settings
In both bulk upload scripts, you can modify:
```javascript
browser = await chromium.launch({ 
  headless: false, // Set to true for headless mode
  slowMo: 1000 // Slow down actions for better visibility
});
```

### Application URL
The scripts expect your application to be running on:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## 🔧 Troubleshooting

### Common Issues

1. **Excel File Not Found**
   - Run the template generator first
   - Check file paths in the scripts

2. **Login Failures**
   - Verify user credentials in Excel files
   - Ensure users exist in database

3. **Element Not Found**
   - Check that application is running
   - Verify frontend is accessible

4. **Recipient Not Found (Colleague Feedback)**
   - Ensure recipient emails exist in database
   - Check email format and spelling

### Debug Mode
To see automation in real-time:
- Keep `headless: false` in browser launch options
- Browser will open and show automation

## 📊 Sample Data

### Manager Feedback Sample
```javascript
{
  Username: 'employee1@msg-global.com',
  Password: '123456',
  Quarter: 'Q1',
  Year: '2024',
  IsAnonymous: 'false',
  ManagerSatisfaction: 'Very Satisfied',
  ManagerOverallRating: 4,
  ClarityGoals: 'Above average',
  // ... other fields
}
```

### Colleague Feedback Sample
```javascript
{
  Username: 'employee1@msg-global.com',
  Password: '123456',
  Quarter: 'Q1',
  Year: '2024',
  IsAnonymous: 'false',
  RecipientEmail: 'colleague1@msg-global.com',
  Appreciation: 'I really appreciate how John always takes the time...',
  Improvement: 'John could improve by being more proactive...',
  Rating: 4,
  WouldWorkAgain: 'true'
}
```

## 📚 Additional Documentation

- `README-MANAGER-FEEDBACK.md` - Detailed manager feedback documentation
- `README-COLLEAGUE-FEEDBACK.md` - Detailed colleague feedback documentation
- `README.md` - General bulk upload documentation

## 🎯 Tips

1. **Test First**: Use the test scripts to verify Excel reading works
2. **Small Batches**: Start with a few entries to test the process
3. **Backup Data**: Keep backups of your Excel files
4. **Monitor Progress**: Watch the console output for progress and errors
5. **Verify Results**: Check the application to confirm feedback was submitted 