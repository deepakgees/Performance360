# Backend Logging System

## Overview

The backend now includes a comprehensive logging system that automatically logs all API requests with user information, response details, and performance metrics. All logs are stored in date-based files in the `backend/logs/` directory.

## Features

### ✅ **Automatic API Request Logging**

- Every API request is automatically logged with user information
- Includes HTTP method, URL, status code, and response time
- User information is prefixed to all log entries

### ✅ **Date-Based Log Files**

- Log files are created daily with format: `YYYY-MM-DD.log`
- Automatic log file rotation based on date
- Easy to track issues by date

### ✅ **User Tracking**

- All log entries include the user who made the request
- Anonymous requests are marked as "Anonymous"
- User format: `FirstName LastName (email@example.com)`

### ✅ **Comprehensive Log Levels**

- **INFO**: General information and API access
- **WARN**: Warning messages and validation errors
- **ERROR**: Error messages with full stack traces
- **DEBUG**: Debug information for development

### ✅ **Performance Monitoring**

- Response time tracking for all API requests
- Database operation logging
- Authentication event logging

## Log File Format

Each log entry follows this format:

```
[Timestamp] [Level] [User: UserInfo] [Method URL] [Status: Code] [Duration: Time] Message
```

### Examples:

**API Access:**

```
[2025-07-20T13:45:55.781Z] [INFO] [User: John Doe (john@example.com)] [GET /api/users] [Status: 200] [Duration: 150ms] API Access
```

**Authentication:**

```
[2025-07-20T13:45:55.787Z] [INFO] [User: john@example.com] Authentication login successful
```

**Database Operations:**

```
[2025-07-20T13:45:55.784Z] [INFO] [User: John Doe (john@example.com)] Database SELECT on users
```

**Errors:**

```
[2025-07-20T13:45:55.773Z] [ERROR] [User: Admin User (admin@example.com)] [DELETE /api/test] This is an error message
Error: {stack trace}
```

## Directory Structure

```
backend/
├── logs/                    # Log files directory
│   ├── 2025-07-20.log      # Today's log file
│   ├── 2025-07-19.log      # Yesterday's log file
│   └── ...                  # Previous days
├── src/
│   ├── utils/
│   │   └── logger.ts        # Logger implementation
│   ├── middleware/
│   │   ├── requestLogger.ts # API request logging middleware
│   │   └── errorHandler.ts  # Error logging middleware
│   └── ...
└── test-logging.js          # Test script for logging
```

## Usage

### Starting the Server

```bash
# Development mode (with console logging)
npm run dev

# Production mode (file logging only)
npm run build
npm start
```

### Testing the Logging

```bash
# Test logging functionality
node test-logging.js

# Start server with logging info
node start-server.js
```

### Viewing Logs

```bash
# View today's logs
cat logs/$(date +%Y-%m-%d).log

# View recent logs
tail -f logs/$(date +%Y-%m-%d).log

# Search for specific user
grep "John Doe" logs/$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" logs/$(date +%Y-%m-%d).log
```

## API Endpoints That Are Logged

All API endpoints are automatically logged, including:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Assessments**: `/api/assessments/*`
- **Users**: `/api/users/*`
- **Feedback**: `/api/colleague-feedback/*`, `/api/manager-feedback/*`
- **Health Check**: `/health`

## Log Levels

### Development Mode

- All log levels are written to both console and file
- Includes DEBUG level information

### Production Mode

- Only INFO, WARN, and ERROR levels are written to file
- Console logging is disabled for performance

## Configuration

The logging system can be configured via environment variables:

```bash
# Log level (INFO, WARN, ERROR, DEBUG)
LOG_LEVEL=INFO

# Node environment (development/production)
NODE_ENV=development
```

## Benefits

1. **User Accountability**: Every action is tied to a specific user
2. **Performance Monitoring**: Track API response times
3. **Error Tracking**: Full error details with stack traces
4. **Audit Trail**: Complete history of all API interactions
5. **Debugging**: Easy to trace issues by user and timestamp
6. **Security**: Monitor for suspicious activity patterns

## Monitoring Examples

### Find User Activity

```bash
grep "john@example.com" logs/2025-07-20.log
```

### Find Slow Requests

```bash
grep "Duration: [0-9][0-9][0-9]ms" logs/2025-07-20.log
```

### Find Errors

```bash
grep "ERROR" logs/2025-07-20.log
```

### Find Authentication Issues

```bash
grep "Authentication.*failed" logs/2025-07-20.log
```

## Integration

The logging system is automatically integrated into:

1. **Request Middleware**: Logs all incoming API requests
2. **Error Handler**: Logs all unhandled errors
3. **Authentication**: Logs login/logout events
4. **Database Operations**: Logs all database queries
5. **Route Handlers**: Logs specific business logic events

This provides complete visibility into the application's behavior and user interactions.
