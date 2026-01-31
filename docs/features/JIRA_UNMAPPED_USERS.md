# Jira Unmapped Users Feature

## Overview

The Jira Unmapped Users feature allows administrators to map Jira assignees to system users, enabling proper reporting and analytics for Jira tickets.

## Features

### Backend API Endpoints

1. **GET /api/jira-tickets/unmapped-users**
   - Returns all unique assignees from `jira_tickets` table where `assigneeId` is null
   - Also returns all active system users for the dropdown selection
   - Response format:
     ```json
     {
       "unmappedUsers": ["John Doe", "Jane Smith"],
       "systemUsers": [
         {
           "id": "user123",
           "firstName": "John",
           "lastName": "Doe",
           "email": "john.doe@example.com"
         }
       ]
     }
     ```

2. **PATCH /api/jira-tickets/update-assignee-mapping**
   - Updates the `assigneeId` field for all Jira tickets with a specific assignee name
   - Request body:
     ```json
     {
       "assigneeName": "John Doe",
       "userId": "user123"
     }
     ```
   - Response format:
     ```json
     {
       "message": "Successfully mapped John Doe to user user123",
       "updatedCount": 5
     }
     ```

### Frontend Components

1. **JiraUnmappedUsers Page** (`frontend/src/pages/JiraUnmappedUsers.tsx`)
   - Displays a table with unmapped Jira assignees
   - Provides dropdown to select system users
   - Includes "Update Mapping" button for each assignee
   - Shows loading states and error handling
   - Displays success/error toast notifications

2. **Navigation Integration**
   - Added to Settings section in sidebar
   - Accessible only to ADMIN users
   - Route: `/settings/jira-unmapped-users`

3. **API Service** (`frontend/src/services/api.ts`)
   - `jiraUnmappedUsersAPI.getUnmappedUsers()`
   - `jiraUnmappedUsersAPI.updateAssigneeMapping(assigneeName, userId)`

## Database Schema

The feature uses the existing `jira_tickets` table:

```sql
CREATE TABLE jira_tickets (
  jira_id VARCHAR PRIMARY KEY,
  assignee VARCHAR,
  assignee_id VARCHAR REFERENCES users(id),
  -- other fields...
);
```

## Usage

1. **Access the Page**: Navigate to Settings → Jira Unmapped Users
2. **View Unmapped Users**: The page shows all Jira assignees that haven't been mapped to system users
3. **Select System User**: Use the dropdown to choose the appropriate system user for each assignee
4. **Update Mapping**: Click "Update Mapping" to link the Jira assignee to the selected system user
5. **Verification**: Once mapped, the assignee will no longer appear in the list

## Benefits

- **Improved Reporting**: Jira tickets can now be properly associated with system users
- **Better Analytics**: Enables user-specific Jira performance metrics
- **Data Consistency**: Ensures Jira data aligns with internal user management
- **Admin Control**: Provides administrators with tools to manage user mappings

## Technical Implementation

### Backend
- **File**: `backend/src/routes/jira-tickets.ts`
- **New Endpoints**: Added to existing Jira tickets router
- **Database**: Uses Prisma ORM with PostgreSQL
- **Authentication**: Protected by existing auth middleware

### Frontend
- **File**: `frontend/src/pages/JiraUnmappedUsers.tsx`
- **State Management**: Uses React Query for data fetching and caching
- **UI Framework**: Built with Tailwind CSS
- **Notifications**: Uses react-hot-toast for user feedback

## Security

- **Access Control**: Only ADMIN users can access this feature
- **Input Validation**: Backend validates all input parameters
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: All operations are logged for audit purposes

## Future Enhancements

- Bulk mapping functionality
- Import/export mapping configurations
- Mapping history and audit trail
- Automatic mapping suggestions based on name similarity
- Integration with Jira user management APIs 