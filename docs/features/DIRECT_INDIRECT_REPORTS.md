# Direct and Indirect Reports Feature

This document describes the new Direct and Indirect Reports functionality added to Performance360.

## Overview

The application now includes two new pages that are only visible to users with MANAGER or ADMIN roles:

1. **My Direct Reports** - Shows team members who report directly to the current user
2. **My Indirect Reports** - Shows team members who report to users who report to the current user

## Features

### My Direct Reports Page

- **Access Control**: Only visible to users with MANAGER or ADMIN roles
- **User List**: Displays all users who have the current user as their manager
- **Search Functionality**: Filter users by name, email, department, or position
- **User Information**: Shows user details including:
  - Full name and email
  - Role badge (EMPLOYEE, MANAGER, ADMIN)
  - Department and position
  - Last login date
  - Member since date
- **Empty State**: Displays appropriate message when no direct reports exist

### My Indirect Reports Page

- **Access Control**: Only visible to users with MANAGER or ADMIN roles
- **User List**: Displays all users who report to the current user's direct reports
- **Search Functionality**: Filter users by name, email, department, position, or manager name
- **User Information**: Shows user details including:
  - Full name and email
  - Role badge (EMPLOYEE, MANAGER, ADMIN)
  - Department and position
  - Manager information (who they report to)
  - Last login date
  - Member since date
- **Empty State**: Displays appropriate message when no indirect reports exist

## Technical Implementation

### Backend Changes

#### New API Endpoints

1. **GET /api/users/direct-reports**

   - Returns all users who have the current user as their manager
   - Requires MANAGER or ADMIN role
   - Returns user data with basic information

2. **GET /api/users/indirect-reports**
   - Returns all users who report to the current user's direct reports
   - Requires MANAGER or ADMIN role
   - Returns user data with manager information

#### Database Queries

- **Direct Reports**: `SELECT * FROM users WHERE managerId = currentUserId AND isActive = true`
- **Indirect Reports**:
  1. Get direct report IDs: `SELECT id FROM users WHERE managerId = currentUserId AND isActive = true`
  2. Get indirect reports: `SELECT * FROM users WHERE managerId IN (directReportIds) AND isActive = true`

### Frontend Changes

#### New Components

1. **ManagerRoute.tsx**

   - Route protection component for MANAGER and ADMIN roles
   - Redirects non-manager users to dashboard

2. **DirectReports.tsx**

   - Page component for displaying direct reports
   - Includes search, filtering, and user display functionality

3. **IndirectReports.tsx**
   - Page component for displaying indirect reports
   - Includes search, filtering, and user display functionality

#### Updated Components

1. **Sidebar.tsx**

   - Added navigation items for "My Direct Reports" and "My Indirect Reports"
   - Only visible to users with MANAGER or ADMIN roles

2. **App.tsx**

   - Added new routes for direct and indirect reports pages
   - Protected with ManagerRoute component

3. **api.ts**
   - Added new API service functions for fetching direct and indirect reports

## Role-Based Access Control

### User Roles

- **EMPLOYEE**: Cannot access direct or indirect reports pages
- **MANAGER**: Can access both direct and indirect reports pages
- **ADMIN**: Can access both direct and indirect reports pages

### Route Protection

- Direct access to `/direct-reports` or `/indirect-reports` by non-manager users redirects to dashboard
- Navigation items are hidden for users without appropriate roles

## User Interface

### Navigation

The sidebar now includes two new navigation items for manager and admin users:

```
Dashboard
Colleague Feedback
Manager Feedback
Self Assessment
My Direct Reports      ← New (Manager/Admin only)
My Indirect Reports    ← New (Manager/Admin only)
Profile
Users                 (Admin only)
```

### Page Layout

Both pages follow the same design pattern:

1. **Header Section**

   - Page title and description
   - Clear indication of what the page shows

2. **Search Section**

   - Search input with appropriate placeholder text
   - Results count display

3. **Content Section**
   - User list with avatar, name, role, and details
   - Empty state when no users exist
   - Loading and error states

## Testing

### Playwright Tests

A comprehensive test suite has been created to verify:

1. **Page Access**

   - Manager users can access both pages
   - Employee users cannot access pages
   - Direct URL access is properly protected

2. **Functionality**

   - Search functionality works correctly
   - Empty states display appropriately
   - Navigation items show/hide based on user role

3. **UI Elements**
   - All page elements are properly displayed
   - Search inputs have correct placeholders
   - User information is displayed correctly

### Test Files

- `tests/playwright-tests/tests/direct-indirect-reports.spec.js`

## API Documentation

### Direct Reports Endpoint

```http
GET /api/users/direct-reports
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": "clx1234567890",
    "email": "employee@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "position": "Developer",
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Indirect Reports Endpoint

```http
GET /api/users/indirect-reports
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "id": "clx1234567890",
    "email": "employee@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "department": "Engineering",
    "position": "Developer",
    "lastLoginAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "manager": {
      "id": "clx0987654321",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  }
]
```

## Error Handling

### Backend Errors

- **403 Forbidden**: When user doesn't have MANAGER or ADMIN role
- **500 Internal Server Error**: Database or server errors

### Frontend Errors

- **Loading States**: Spinner displayed while fetching data
- **Error States**: Error message displayed when API calls fail
- **Empty States**: Appropriate messages when no data exists

## Future Enhancements

Potential improvements for future versions:

1. **Export Functionality**: Allow exporting reports to CSV/Excel
2. **Advanced Filtering**: Filter by department, role, or date ranges
3. **Bulk Actions**: Select multiple users for bulk operations
4. **Hierarchy Visualization**: Tree view of reporting structure
5. **Performance Metrics**: Show team performance indicators
6. **Real-time Updates**: WebSocket updates for real-time changes

## Deployment Notes

1. **Database**: No new migrations required (uses existing user table)
2. **Environment Variables**: No new environment variables needed
3. **Dependencies**: No new dependencies added
4. **Build Process**: Standard build process applies

## Security Considerations

1. **Role-based Access**: Proper role checking on both frontend and backend
2. **Data Privacy**: Only shows users that the current user should have access to
3. **Input Validation**: Search inputs are properly sanitized
4. **Error Handling**: Sensitive information is not exposed in error messages
