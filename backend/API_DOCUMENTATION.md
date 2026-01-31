# API Documentation

## Overview

This document provides detailed information about the Performance360 API endpoints, including request/response formats, authentication, and error handling.

## Base Information

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token (for protected endpoints)

## API Endpoints

### Authentication

#### Login

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }
}
```

### User Management

#### Get Current User Profile

**GET** `/api/users/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "EMPLOYEE",
  "department": "Engineering",
  "position": "Developer",
  "managerId": "clx0987654321",
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "lastLoginAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Update User Profile

**PUT** `/api/users/profile`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "department": "Engineering",
  "position": "Senior Developer"
}
```

**Response (200):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "position": "Senior Developer"
  }
}
```

#### Get All Users (Admin/Manager)

**GET** `/api/users`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": "clx1234567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "position": "Developer",
    "isActive": true
  }
]
```

## Feedback Management

### Get Received Feedback

**GET** `/feedback/received`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": "clx1234567890",
    "senderId": "clx0987654321",
    "receiverId": "clx1234567890",
    "teamId": "clx5555555555",
    "type": "PEER",
    "category": "COLLABORATION",
    "title": "Great teamwork",
    "content": "You did an excellent job collaborating on the project",
    "rating": 5,
    "isAnonymous": false,
    "isPublic": true,
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "sender": {
      "id": "clx0987654321",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "EMPLOYEE"
    },
    "team": {
      "id": "clx5555555555",
      "name": "Engineering Team"
    }
  }
]
```

### Get Sent Feedback

**GET** `/feedback/sent`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": "clx1234567890",
    "senderId": "clx1234567890",
    "receiverId": "clx0987654321",
    "teamId": "clx5555555555",
    "type": "PEER",
    "category": "PERFORMANCE",
    "title": "Excellent work",
    "content": "Your performance on the project was outstanding",
    "rating": 5,
    "isAnonymous": false,
    "isPublic": true,
    "status": "ACKNOWLEDGED",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "receiver": {
      "id": "clx0987654321",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "EMPLOYEE"
    },
    "team": {
      "id": "clx5555555555",
      "name": "Engineering Team"
    }
  }
]
```

### Create Feedback

**POST** `/feedback`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "receiverId": "clx0987654321",
  "title": "Great collaboration",
  "content": "You did an excellent job on the project",
  "type": "PEER",
  "category": "COLLABORATION",
  "rating": 5,
  "isAnonymous": false,
  "isPublic": true,
  "teamId": "clx5555555555"
}
```

**Response (201):**

```json
{
  "id": "clx1234567890",
  "senderId": "clx1234567890",
  "receiverId": "clx0987654321",
  "teamId": "clx5555555555",
  "type": "PEER",
  "category": "COLLABORATION",
  "title": "Great collaboration",
  "content": "You did an excellent job on the project",
  "rating": 5,
  "isAnonymous": false,
  "isPublic": true,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "sender": {
    "id": "clx1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  },
  "receiver": {
    "id": "clx0987654321",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "EMPLOYEE"
  }
}
```

### Update Feedback Status

**PATCH** `/feedback/:id/status`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "status": "ACKNOWLEDGED"
}
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "status": "ACKNOWLEDGED",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Self-Assessments (V2)

### Get User's Self-Assessments

**GET** `/assessments`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": "clx1234567890",
    "userId": "clx1234567890",
    "year": 2024,
    "quarter": "Q1",
    "rating": 4,
    "achievements": "Completed major feature implementation",
    "improvements": "Need to improve documentation",
    "satisfactionLevel": "VERY_SATISFIED",
    "aspirations": "Lead a team project",
    "suggestionsForTeam": "Improve code review process",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Get Self-Assessments by User ID (Admin/Manager Only)

**GET** `/assessments/user/:userId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):** Same structure as above

### Get Self-Assessment by ID

**GET** `/assessments/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):** Same structure as above

### Create Self-Assessment

**POST** `/assessments`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "year": 2024,
  "quarter": "Q1",
  "rating": 4,
  "achievements": "Completed major feature implementation",
  "improvements": "Need to improve documentation",
  "satisfactionLevel": "VERY_SATISFIED",
  "aspirations": "Lead a team project",
  "suggestionsForTeam": "Improve code review process"
}
```

**Field Descriptions:**
- `year` (required): Assessment year (e.g., 2024)
- `quarter` (optional): Assessment quarter - "Q1", "Q2", "Q3", "Q4", or "ANNUAL" (null for annual assessments)
- `rating` (optional): Self-rating on a scale of 1-5
- `achievements` (optional): Key achievements text
- `improvements` (optional): Areas for improvement text
- `satisfactionLevel` (optional): Satisfaction level enum - "VERY_SATISFIED", "SOMEWHAT_SATISFIED", "NEITHER", "SOMEWHAT_DISSATISFIED", "VERY_DISSATISFIED"
- `aspirations` (optional): Career aspirations text
- `suggestionsForTeam` (optional): Team improvement suggestions text

**Response (201):**

```json
{
  "id": "clx1234567890",
  "userId": "clx1234567890",
  "year": 2024,
  "quarter": "Q1",
  "rating": 4,
  "achievements": "Completed major feature implementation",
  "improvements": "Need to improve documentation",
  "satisfactionLevel": "VERY_SATISFIED",
  "aspirations": "Lead a team project",
  "suggestionsForTeam": "Improve code review process",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Update Self-Assessment

**PUT** `/assessments/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:** (All fields are optional)

```json
{
  "year": 2024,
  "quarter": "Q1",
  "rating": 5,
  "achievements": "Updated achievements",
  "improvements": "Updated improvements",
  "satisfactionLevel": "VERY_SATISFIED",
  "aspirations": "Updated aspirations",
  "suggestionsForTeam": "Updated suggestions"
}
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "userId": "clx1234567890",
  "year": 2024,
  "quarter": "Q1",
  "rating": 5,
  "achievements": "Updated achievements",
  "improvements": "Updated improvements",
  "satisfactionLevel": "VERY_SATISFIED",
  "aspirations": "Updated aspirations",
  "suggestionsForTeam": "Updated suggestions",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T10:30:00Z"
}
```

### Delete Self-Assessment

**DELETE** `/assessments/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "message": "Assessment deleted successfully"
}
```

### Submit Assessment

**PATCH** `/assessments/:id/submit`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "status": "SUBMITTED",
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

## Goal Management

### Get User's Goals

**GET** `/goals`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "id": "clx1234567890",
    "userId": "clx1234567890",
    "teamId": "clx5555555555",
    "title": "Learn React",
    "description": "Master React fundamentals and build a project",
    "type": "PERSONAL",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "startDate": "2024-01-01T00:00:00Z",
    "dueDate": "2024-03-31T23:59:59Z",
    "completedAt": null,
    "progress": 60,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Create Goal

**POST** `/goals`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Learn React",
  "description": "Master React fundamentals and build a project",
  "type": "PERSONAL",
  "priority": "HIGH",
  "startDate": "2024-01-01T00:00:00Z",
  "dueDate": "2024-03-31T23:59:59Z",
  "teamId": "clx5555555555"
}
```

**Response (201):**

```json
{
  "id": "clx1234567890",
  "userId": "clx1234567890",
  "teamId": "clx5555555555",
  "title": "Learn React",
  "description": "Master React fundamentals and build a project",
  "type": "PERSONAL",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "startDate": "2024-01-01T00:00:00Z",
  "dueDate": "2024-03-31T23:59:59Z",
  "completedAt": null,
  "progress": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Update Goal Progress

**PATCH** `/goals/:id/progress`

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "progress": 75
}
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "progress": 75,
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Error Responses

### Standard Error Format

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

| Code  | Description                             |
| ----- | --------------------------------------- |
| `200` | Success                                 |
| `201` | Created                                 |
| `400` | Bad Request - Validation errors         |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Insufficient permissions    |
| `404` | Not Found - Resource doesn't exist      |
| `500` | Internal Server Error                   |

### Validation Errors

When validation fails, the response includes detailed error information:

```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Invalid email format",
      "path": "email",
      "location": "body"
    },
    {
      "type": "field",
      "value": "123",
      "msg": "Password must be at least 6 characters long",
      "path": "password",
      "location": "body"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns `429 Too Many Requests` when limit is exceeded

## Health Check

### Get Server Health

**GET** `/health`

**Response (200):**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Data Types

### Enums

#### UserRole

- `ADMIN` - Full system access
- `MANAGER` - Team management access
- `EMPLOYEE` - Basic user access

#### FeedbackType

- `PEER` - Peer-to-peer feedback
- `MANAGER` - Manager feedback
- `SELF` - Self-assessment
- `TEAM` - Team feedback

#### FeedbackCategory

- `PERFORMANCE` - Performance-related feedback
- `COLLABORATION` - Teamwork and collaboration
- `LEADERSHIP` - Leadership skills
- `COMMUNICATION` - Communication skills
- `TECHNICAL_SKILLS` - Technical abilities
- `INNOVATION` - Innovation and creativity
- `OTHER` - Other categories

#### GoalStatus

- `NOT_STARTED` - Goal not yet started
- `IN_PROGRESS` - Goal in progress
- `COMPLETED` - Goal completed
- `CANCELLED` - Goal cancelled

#### Priority

- `LOW` - Low priority
- `MEDIUM` - Medium priority
- `HIGH` - High priority
- `URGENT` - Urgent priority
