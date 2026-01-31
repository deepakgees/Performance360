# Jira Tickets Extraction API

This feature allows you to extract ticket data from Jira using JQL queries and store it in a local database for analysis and reporting.

## Features

- **JQL Query Support**: Extract tickets using any valid JQL query
- **Automatic Pagination**: Handles large result sets by fetching all pages automatically
- **Comprehensive Data Extraction**: Captures all required ticket fields
- **Time Tracking**: Calculates time spent in different statuses
- **Database Storage**: Stores extracted data in PostgreSQL
- **REST API**: Full CRUD operations for managing extracted tickets
- **Filtering & Pagination**: Advanced querying capabilities
- **Error Handling**: Robust error handling and logging

## Extracted Data Fields

| Field                | Description                                  |
| -------------------- | -------------------------------------------- |
| **ID**               | Jira ticket ID (e.g., "PROJ-123")            |
| **Link**             | HTTP link to the Jira ticket                 |
| **Title**            | Title of the Jira ticket                     |
| **Priority**         | Priority of the ticket                       |
| **CreateDate**       | Date when ticket was created                 |
| **EndDate**          | Date when ticket was resolved                |
| **OriginalEstimate** | Original estimate in seconds                 |
| **Components**       | List of components in the ticket             |
| **DueDate**          | Any due date set in the ticket               |
| **Assignee**         | Full name of assignee                        |
| **Reporter**         | Full name of reporter                        |
| **InProgressTime**   | Total time when ticket was in-progress       |
| **BlockedTime**      | Total time the ticket was blocked            |
| **ReviewTime**       | Total time the ticket was in review          |
| **PromotionTime**    | Total time the ticket was in promotion phase |

## API Endpoints

- `POST /api/jira-tickets/extract` - Extract tickets from Jira
- `GET /api/jira-tickets` - Get all tickets with filtering
- `GET /api/jira-tickets/:jiraId` - Get specific ticket by Jira ID
- `DELETE /api/jira-tickets/:jiraId` - Delete specific ticket by Jira ID
- `DELETE /api/jira-tickets` - Delete all tickets

## Quick Start

1. **Start the server**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Extract tickets**:

   ```bash
   curl -X POST http://localhost:5000/api/jira-tickets/extract \
     -H "Content-Type: application/json" \
     -d '{
       "jql": "project = \"PROJ\" AND created >= \"2024-01-01\"",
       "server": "https://your-instance.atlassian.net",
       "username": "your-jira-username",
       "password": "your-jira-password"
     }'
   ```

3. **View extracted tickets**:
   ```bash
   curl "http://localhost:5000/api/jira-tickets"
   ```

## Pagination

The extract endpoint automatically handles Jira's pagination to fetch all matching tickets:

- **Automatic Page Fetching**: Retrieves all pages of results automatically
- **Progress Logging**: Logs progress for each page being fetched
- **Large Result Sets**: Can handle thousands of tickets efficiently
- **Memory Efficient**: Processes tickets page by page to avoid memory issues

## Status Tracking

The API automatically tracks time spent in different ticket statuses:

- **In Progress**: `IN PROGRESS`, `DEVELOPMENT`, `In Progress`, `Development`, `Active`, `Working`
- **Blocked**: `BLOCKED`, `ON HOLD`, `PAUSED`, `Blocked`, `On Hold`, `Paused`, `Waiting`
- **Review**: `CODE REVIEW`, `REVIEW`, `Code Review`, `Review`, `Testing`, `QA`, `Quality Assurance`
- **Promotion**: `PROMOTION`, `DEPLOYMENT`, `RELEASE`, `Promotion`, `Deployment`, `Release`, `Done`, `Resolved`, `Closed`

**Note**: The status tracking now uses improved chronological analysis to accurately calculate time spent in each status.

## Database Schema

The extracted data is stored in the `jira_tickets` table with the following structure:

```sql
CREATE TABLE jira_tickets (
  jira_id TEXT PRIMARY KEY,
  link TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT,
  create_date TIMESTAMP,
  end_date TIMESTAMP,
  original_estimate INTEGER,
  components TEXT[],
  due_date TIMESTAMP,
  assignee TEXT,
  reporter TEXT,
  in_progress_time INTEGER,
  blocked_time INTEGER,
  review_time INTEGER,
  promotion_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

The API uses the following configuration constants for status tracking:

```typescript
const IN_PROGRESS_STATUSES = [
  'IN PROGRESS',
  'DEVELOPMENT',
  'In Progress',
  'Development',
  'Active',
  'Working',
];
const BLOCKED_STATUSES = [
  'BLOCKED',
  'ON HOLD',
  'PAUSED',
  'Blocked',
  'On Hold',
  'Paused',
  'Waiting',
];
const REVIEW_STATUSES = [
  'CODE REVIEW',
  'REVIEW',
  'Code Review',
  'Review',
  'Testing',
  'QA',
  'Quality Assurance',
];
const PROMOTION_STATUSES = [
  'PROMOTION',
  'DEPLOYMENT',
  'RELEASE',
  'Promotion',
  'Deployment',
  'Release',
  'Done',
  'Resolved',
  'Closed',
];
```

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Input validation with detailed error messages
- **Jira API Errors**: Proper handling of Jira API failures
- **Database Errors**: Graceful handling of database operations
- **Authentication Errors**: Secure token validation

## Logging

All operations are logged with appropriate log levels:

- **Info**: Successful operations and statistics
- **Warning**: Non-critical issues
- **Error**: Failed operations with stack traces

## Security

- **Authentication**: Only the extract endpoint requires Jira authentication via username/password
- **Input Validation**: All inputs are validated and sanitized
- **Credential Security**: Jira credentials are not stored
- **HTTPS**: Use HTTPS in production environments

## Testing

Use the provided test script to verify functionality:

```bash
cd backend
node test-jira-tickets.js
```

## Documentation

For detailed API documentation, see [JIRA_TICKETS_API.md](./JIRA_TICKETS_API.md).

## Dependencies

- `axios` - HTTP client for Jira API calls
- `@prisma/client` - Database ORM
- `express-validator` - Input validation
- `express` - Web framework

## Migration

The database migration has been created and applied. The `jira_tickets` table is now available in your database.

## Support

For issues or questions, please refer to the main project documentation or create an issue in the project repository.
