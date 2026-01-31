# Jira Tickets API Documentation

This document describes the REST API endpoints for extracting and managing Jira ticket data.

## Overview

The Jira Tickets API allows you to:

- Extract ticket data from Jira using JQL queries
- Store extracted data in a local database
- Retrieve and filter stored tickets
- Delete tickets as needed

## Base URL

```
http://localhost:5000/api/jira-tickets
```

## Authentication

The Jira Tickets API uses Basic Authentication with username and password. The credentials are passed in the request body:

```json
{
  "username": "your-jira-username",
  "password": "your-jira-password"
}
```

## Endpoints

### 1. Extract Tickets from Jira

**POST** `/api/jira-tickets/extract`

Extracts ticket data from Jira using a JQL query and stores it in the database. **Automatically handles pagination to fetch all matching tickets across multiple pages.**

#### Request Body

```json
{
  "jql": "project = 'PROJ' AND created >= '2024-01-01'",
  "server": "https://your-instance.atlassian.net",
  "username": "your-jira-username",
  "password": "your-jira-password"
}
```

#### Headers

| Header         | Type   | Required | Description                |
| -------------- | ------ | -------- | -------------------------- |
| `Content-Type` | string | Yes      | Must be `application/json` |

#### Parameters

| Parameter  | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `jql`      | string | Yes      | JQL query to filter tickets |
| `server`   | string | Yes      | Jira server URL             |
| `username` | string | Yes      | Jira username               |
| `password` | string | Yes      | Jira password               |

**Note**: The API automatically handles pagination to fetch all matching tickets, regardless of the total number of results.

#### Response

```json
{
  "success": true,
  "message": "Jira tickets extracted and stored successfully",
  "data": {
    "totalTickets": 250,
    "extractedTickets": 245,
    "storedTickets": 245,
    "errors": ["Failed to extract data for ticket PROJ-123"]
  }
}
```

#### Example Usage

```bash
curl -X POST http://localhost:5000/api/jira-tickets/extract \
  -H "Content-Type: application/json" \
  -d '{
    "jql": "project = \"PROJ\" AND created >= \"2024-01-01\"",
    "server": "https://example.atlassian.net",
    "username": "your-jira-username",
    "password": "your-jira-password"
  }'
```

### 2. Get All Tickets

**GET** `/api/jira-tickets`

Retrieves all stored tickets with optional filtering and pagination.

#### Query Parameters

| Parameter   | Type   | Default | Description                             |
| ----------- | ------ | ------- | --------------------------------------- |
| `page`      | number | 1       | Page number for pagination              |
| `limit`     | number | 50      | Number of tickets per page              |
| `assignee`  | string | -       | Filter by assignee name (partial match) |
| `reporter`  | string | -       | Filter by reporter name (partial match) |
| `priority`  | string | -       | Filter by priority                      |
| `startDate` | string | -       | Filter by creation date (YYYY-MM-DD)    |
| `endDate`   | string | -       | Filter by creation date (YYYY-MM-DD)    |

#### Response

```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "jiraId": "PROJ-123",
        "link": "https://example.atlassian.net/browse/PROJ-123",
        "title": "Implement new feature",
        "priority": "High",
        "createDate": "2024-01-15T10:30:00Z",
        "endDate": "2024-01-20T16:45:00Z",
        "originalEstimate": 28800,
        "components": ["Frontend", "Backend"],
        "dueDate": "2024-01-25T00:00:00Z",
        "assignee": "John Doe",
        "reporter": "Jane Smith",
        "inProgressTime": 86400,
        "blockedTime": 3600,
        "reviewTime": 7200,
        "promotionTime": 1800,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T16:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

#### Example Usage

```bash
# Get all tickets
curl "http://localhost:5000/api/jira-tickets"

# Get tickets with filters
curl "http://localhost:5000/api/jira-tickets?page=1&limit=10&priority=High&assignee=John"

# Get tickets by date range
curl "http://localhost:5000/api/jira-tickets?startDate=2024-01-01&endDate=2024-01-31"
```

### 3. Get Specific Ticket

**GET** `/api/jira-tickets/:jiraId`

Retrieves a specific ticket by its Jira ID.

#### Path Parameters

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `jiraId`  | string | Yes      | Jira ID of the ticket (e.g., "PROJ-123") |

#### Response

```json
{
  "success": true,
  "data": {
    "jiraId": "PROJ-123",
    "link": "https://example.atlassian.net/browse/PROJ-123",
    "title": "Implement new feature",
    "priority": "High",
    "createDate": "2024-01-15T10:30:00Z",
    "endDate": "2024-01-20T16:45:00Z",
    "originalEstimate": 28800,
    "components": ["Frontend", "Backend"],
    "dueDate": "2024-01-25T00:00:00Z",
    "assignee": "John Doe",
    "reporter": "Jane Smith",
    "inProgressTime": 86400,
    "blockedTime": 3600,
    "reviewTime": 7200,
    "promotionTime": 1800,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T16:45:00Z"
  }
}
```

#### Example Usage

```bash
curl "http://localhost:5000/api/jira-tickets/PROJ-123"
```

### 4. Delete Specific Ticket

**DELETE** `/api/jira-tickets/:jiraId`

Deletes a specific ticket from the database.

#### Path Parameters

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `jiraId`  | string | Yes      | Jira ID of the ticket (e.g., "PROJ-123") |

#### Response

```json
{
  "success": true,
  "message": "Jira ticket deleted successfully",
  "data": {
    "jiraId": "PROJ-123"
    // ... other ticket fields
  }
}
```

#### Example Usage

```bash
curl -X DELETE "http://localhost:5000/api/jira-tickets/PROJ-123"
```

### 5. Delete All Tickets

**DELETE** `/api/jira-tickets`

Deletes all tickets from the database.

#### Response

```json
{
  "success": true,
  "message": "All Jira tickets deleted successfully",
  "data": {
    "deletedCount": 150
  }
}
```

#### Example Usage

```bash
curl -X DELETE "http://localhost:5000/api/jira-tickets"
```

## Data Model

### JiraTicket

| Field              | Type     | Description                                             |
| ------------------ | -------- | ------------------------------------------------------- |
| `jiraId`           | string   | Jira ticket ID (e.g., "PROJ-123") - Primary key         |
| `link`             | string   | HTTP link to the Jira ticket                            |
| `title`            | string   | Title of the Jira ticket                                |
| `priority`         | string   | Priority of the ticket                                  |
| `createDate`       | DateTime | Date when ticket was created                            |
| `endDate`          | DateTime | Date when ticket was resolved                           |
| `originalEstimate` | number   | Original estimate in seconds                            |
| `components`       | string[] | List of components in the ticket                        |
| `dueDate`          | DateTime | Any due date set in the ticket                          |
| `assignee`         | string   | Full name of assignee                                   |
| `reporter`         | string   | Full name of reporter                                   |
| `inProgressTime`   | number   | Total time in seconds when ticket was in-progress       |
| `blockedTime`      | number   | Total time in seconds the ticket was blocked            |
| `reviewTime`       | number   | Total time in seconds the ticket was in review          |
| `promotionTime`    | number   | Total time in seconds the ticket was in promotion phase |
| `createdAt`        | DateTime | When the record was created in database                 |
| `updatedAt`        | DateTime | When the record was last updated                        |

## Status Tracking

The API tracks time spent in different statuses:

- **In Progress**: `IN PROGRESS`, `DEVELOPMENT`
- **Blocked**: `BLOCKED`, `ON HOLD`, `PAUSED`
- **Review**: `CODE REVIEW`, `REVIEW`
- **Promotion**: `PROMOTION`, `DEPLOYMENT`, `RELEASE`

Time calculations are based on changelog entries and are returned in seconds.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid username/password)
- `404` - Not Found (ticket not found)
- `500` - Internal Server Error

## Rate Limiting

The API includes rate limiting to prevent abuse. Please respect reasonable request rates.

## Security Notes

1. **Credentials**: Never store Jira credentials in client-side code
2. **Passwords**: Use secure passwords and consider using API tokens instead of passwords
3. **HTTPS**: Always use HTTPS in production
4. **Validation**: All inputs are validated and sanitized

## Example JQL Queries

Here are some useful JQL query examples:

```sql
-- All tickets from a specific project
project = "PROJ"

-- Tickets created in the last 30 days
project = "PROJ" AND created >= "2024-01-01"

-- High priority tickets
project = "PROJ" AND priority = "High"

-- Tickets assigned to a specific user
project = "PROJ" AND assignee = "john.doe@example.com"

-- Resolved tickets
project = "PROJ" AND status = "Done"

-- Tickets with specific components
project = "PROJ" AND component = "Frontend"
```

## Testing

Use the provided test script to verify API functionality:

```bash
cd backend
node test-jira-tickets.js
```

Remember to update the test token and Jira credentials in the test script before running.
