# JIRA Performance Reporter

A comprehensive JIRA performance reporting system that analyzes team and individual productivity metrics, converted from Python to JavaScript/TypeScript to integrate with Performance360.

## 🚀 Features

### Core Functionality

- **Monthly Performance Reports**: Generate reports for the last 1-12 months
- **Team Metrics**: Track team-wide performance indicators
- **Individual Metrics**: Analyze individual team member performance
- **Time Tracking**: Calculate lead time, cycle time, blocked time, and review time
- **Capacity Planning**: Calculate team and individual capacity based on working days
- **Due Date Tracking**: Identify tickets that missed their due dates

### Metrics Calculated

- **Lead Time**: Time from issue creation to completion
- **Cycle Time**: Time from when work started (in progress) to completion
- **Blocked Time**: Total time issues were in blocked status
- **In Progress Time**: Total time issues were actively being worked on
- **Review Time**: Total time issues spent in code review
- **Capacity**: Team and individual capacity based on working days

## 📋 Prerequisites

### Backend Dependencies

```bash
cd backend
npm install jira-client
```

### Environment Variables

Add the following to your `.env` file:

```env
# JIRA Configuration (optional - can be overridden in the UI)
JIRA_SERVER=https://nexontis.atlassian.net/
JQL_FILTER=filter = "RIEDevOpsTicketsAll"
```

## 🔧 Configuration

### JIRA Server Settings

The system is configured for the Nexontis JIRA instance by default:

- **Server**: `https://nexontis.atlassian.net/`
- **JQL Filter**: `filter = "RIEDevOpsTicketsAll"`
- **Team Members**: Pre-configured list of team members

### Status Mappings

```typescript
const COMPLETED_STATUSES = [
  'DONE - NONTESTABLE',
  'CLOSED',
  'CANCELLED',
  'REJECTED',
  'RESOLVED',
  'CANNOT REPLICATE. RETEST',
  'DONE',
  'PR MERGED IN MAINSTREAM',
];

const IN_PROGRESS_STATUSES = ['IN PROGRESS', 'DEVELOPEMNT'];
const BLOCKED_STATUSES = ['BLOCKED', 'ON HOLD', 'PAUSED'];
const REVIEW_STATUSES = ['CODE REVIEW'];
```

## 🛠️ API Endpoints

### Generate JIRA Report

```http
POST /api/jira-reporter/generate-report
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "your-email@domain.com",
  "password": "your-api-token",
  "server": "https://your-domain.atlassian.net/",
  "num_months": 3
}
```

### Health Check

```http
GET /api/jira-reporter/health
Authorization: Bearer <token>
```

## 📊 Report Structure

### Team Report Data

```typescript
interface MonthlyData {
  team: {
    created: number; // Number of tickets created
    created_keys: string[]; // Ticket keys created
    completed: number; // Number of tickets completed
    completed_keys: string[]; // Ticket keys completed
    original_estimate: number; // Total original estimates
    original_estimate_keys: string[]; // Ticket keys with estimates
    tickets_missing_estimate: number; // Tickets without estimates
    tickets_missing_estimate_keys: string[];
    slipped_due_date: number; // Tickets that missed due dates
    slipped_due_date_keys: string[];
    tickets_missing_due_date: number; // Tickets without due dates
    tickets_missing_due_date_keys: string[];
    total_lead_time: number[]; // Lead times for all tickets
    total_cycle_time: number[]; // Cycle times for all tickets
    total_progress_time: number[]; // In-progress times
    total_review_time: number[]; // Review times
    total_blocked_time: number[]; // Blocked times
    team_capacity: number; // Team capacity in days
    individual_capacity: number; // Individual capacity in days
  };
  individual: {
    [assignee: string]: {
      // Same structure as team but for individual metrics
    };
  };
}
```

## 🎯 Usage

### 1. Access the JIRA Reporter

1. Log into Performance360
2. Navigate to "My Reports" → "JIRA Reporter" in the sidebar
3. Enter your JIRA credentials

### 2. Generate a Report

1. **Username**: Your JIRA email address
2. **Password**: Your JIRA password or API token (recommended)
3. **Server URL**: Your JIRA instance URL (defaults to Nexontis)
4. **Number of Months**: How many months to analyze (1-12)

### 3. View Results

The report displays:

- **Team Performance Table**: Overall team metrics by month
- **Individual Performance Tables**: Per-team-member metrics
- **Time Metrics**: Lead time, cycle time, blocked time, etc.
- **Capacity Information**: Team and individual capacity

## 🔐 Security

### API Token Usage

For better security, use JIRA API tokens instead of passwords:

1. Go to https://id.atlassian.com/manage/api-tokens
2. Click "Create API token"
3. Give it a descriptive name
4. Copy the token and use it as the password

### Authentication

- All JIRA reporter endpoints require authentication
- Uses the same JWT token system as the rest of the app
- Credentials are not stored, only used for API calls

## 📈 Metrics Explained

### Lead Time

- **Definition**: Time from issue creation to completion
- **Calculation**: Working hours between creation and resolution
- **Business Value**: Shows overall process efficiency

### Cycle Time

- **Definition**: Time from when work started to completion
- **Calculation**: Working hours between "In Progress" and resolution
- **Business Value**: Shows development efficiency

### Blocked Time

- **Definition**: Total time issues were in blocked status
- **Calculation**: Sum of all time spent in blocked statuses
- **Business Value**: Identifies process bottlenecks

### In Progress Time

- **Definition**: Total time issues were actively being worked on
- **Calculation**: Sum of all time spent in progress statuses
- **Business Value**: Shows development velocity

### Review Time

- **Definition**: Total time issues spent in code review
- **Calculation**: Sum of all time spent in review statuses
- **Business Value**: Shows code review efficiency

## 🛠️ Customization

### Modifying Team Members

Edit the `TEAM_MEMBERS` array in `backend/src/routes/jira-reporter.ts`:

```typescript
const TEAM_MEMBERS = [
  'Smijil',
  'Lalit Kumar',
  'Monika Chiraniya',
  // Add or remove team members as needed
];
```

### Changing Status Mappings

Update the status arrays to match your JIRA workflow:

```typescript
const COMPLETED_STATUSES = ['Done', 'Closed', 'Resolved'];
const IN_PROGRESS_STATUSES = ['In Progress', 'Development'];
const BLOCKED_STATUSES = ['Blocked', 'On Hold'];
const REVIEW_STATUSES = ['Code Review'];
```

### Modifying JQL Filter

Change the `JQL_FILTER` constant to match your project:

```typescript
const JQL_FILTER = 'project = "YOUR-PROJECT" AND status != "Open"';
```

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors

- **Problem**: "Failed to connect to JIRA"
- **Solution**: Verify username/password or API token
- **Check**: Ensure you have access to the JIRA instance

#### No Data Found

- **Problem**: Report shows no tickets
- **Solution**: Check JQL filter and date range
- **Check**: Verify the JQL filter exists and is accessible

#### SSL Certificate Issues

- **Problem**: SSL verification errors
- **Solution**: The system disables SSL verification for corporate environments
- **Note**: This is intentional for internal JIRA instances

#### Rate Limiting

- **Problem**: "Too many requests" errors
- **Solution**: The system includes built-in rate limiting
- **Note**: Large reports may take time to generate

### Debug Information

Check the backend logs for detailed error information:

```bash
cd backend
npm run dev
# Check console output for JIRA API errors
```

## 📝 API Documentation

### Request Format

```typescript
interface JiraReportRequest {
  username: string; // JIRA email address
  password: string; // JIRA password or API token
  server?: string; // JIRA server URL (optional)
  num_months?: number; // Number of months to analyze (1-12)
  start_date?: string; // Start date (optional, ISO format)
}
```

### Response Format

```typescript
interface JiraReportResponse {
  success: boolean;
  message: string;
  data?: {
    reports: { [key: string]: MonthlyData };
    issue_details: { [key: string]: IssueDetails };
  };
  error?: string;
}
```

## 🔄 Migration from Python

This JavaScript implementation maintains feature parity with the original Python script:

### Preserved Features

- ✅ Monthly report generation
- ✅ Team and individual metrics
- ✅ Time calculations (lead time, cycle time, etc.)
- ✅ Capacity planning
- ✅ Due date tracking
- ✅ Status time tracking
- ✅ JQL filter support

### Improvements

- 🚀 Web-based interface
- 🔐 Integrated authentication
- 📊 Real-time data visualization
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🔄 RESTful API architecture

## 📞 Support

For issues or questions:

1. Check the backend logs for error details
2. Verify JIRA credentials and permissions
3. Ensure the JQL filter is accessible
4. Contact the development team for technical support

---

**Note**: This JIRA reporter is specifically configured for the Nexontis team but can be easily adapted for other teams by modifying the configuration constants.
