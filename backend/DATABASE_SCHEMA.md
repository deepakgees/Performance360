# Database Schema Documentation

## Overview

Performance360 uses PostgreSQL as the primary database with Prisma ORM for type-safe database operations. The schema is designed to support a comprehensive performance management and feedback system with team management capabilities.

## Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│       User      │    │      Team       │    │   TeamMember    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ email (UQ)      │    │ name            │    │ userId (FK)     │
│ firstName       │    │ description     │    │ teamId (FK)     │
│ lastName        │    │ department      │    │ role            │
│ password        │    │ createdAt       │    │ joinedAt        │
│ role            │    │ updatedAt       │    └─────────────────┘
│ department      │    └─────────────────┘              │
│ position        │              │                      │
│ managerId (FK)  │              │                      │
│ avatar          │              │                      │
│ isActive        │              │                      │
│ lastLoginAt     │              │                      │
│ createdAt       │              │                      │
│ updatedAt       │              │                      │
└─────────────────┘              │                      │
         │                       │                      │
         │                       │                      │
         │                       ▼                      │
         │              ┌─────────────────┐              │
         │              │     Feedback    │              │
         │              ├─────────────────┤              │
         │              │ id (PK)         │              │
         │              │ senderId (FK)   │              │
         │              │ receiverId (FK) │              │
         │              │ teamId (FK)     │              │
         │              │ type            │              │
         │              │ category        │              │
         │              │ title           │              │
         │              │ content         │              │
         │              │ rating          │              │
         │              │ isAnonymous     │              │
         │              │ isPublic        │              │
         │              │ status          │              │
         │              │ createdAt       │              │
         │              │ updatedAt       │              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │ SelfAssessment  │              │
         │              ├─────────────────┤              │
         │              │ id (PK)         │              │
         │              │ userId (FK)     │              │
         │              │ period          │              │
         │              │ title           │              │
         │              │ content (JSON)  │              │
         │              │ status          │              │
         │              │ submittedAt     │              │
         │              │ createdAt       │              │
         │              │ updatedAt       │              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │      Goal       │              │
         │              ├─────────────────┤              │
         │              │ id (PK)         │              │
         │              │ userId (FK)     │              │
         │              │ teamId (FK)     │              │
         │              │ title           │              │
         │              │ description     │              │
         │              │ type            │              │
         │              │ status          │              │
         │              │ priority        │              │
         │              │ startDate       │              │
         │              │ dueDate         │              │
         │              │ completedAt     │              │
         │              │ progress        │              │
         │              │ createdAt       │              │
         │              │ updatedAt       │              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   Recognition   │              │
         │              ├─────────────────┤              │
         │              │ id (PK)         │              │
         │              │ senderId (FK)   │              │
         │              │ receiverId (FK) │              │
         │              │ title           │              │
         │              │ message         │              │
         │              │ type            │              │
         │              │ isPublic        │              │
         │              │ createdAt       │              │
         │              └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
```

## Table Definitions

### Users Table

**Purpose**: Stores user account information and authentication data.

| Column        | Type     | Constraints                 | Description               |
| ------------- | -------- | --------------------------- | ------------------------- |
| `id`          | String   | PK, CUID                    | Unique identifier         |
| `email`       | String   | UQ, NOT NULL                | User's email address      |
| `firstName`   | String   | NOT NULL                    | User's first name         |
| `lastName`    | String   | NOT NULL                    | User's last name          |
| `password`    | String   | NOT NULL                    | Hashed password           |
| `role`        | UserRole | NOT NULL, DEFAULT: EMPLOYEE | User's role in the system |
| `department`  | String   | NULL                        | User's department         |
| `position`    | String   | NULL                        | User's job position       |
| `managerId`   | String   | FK (self-ref)               | Reference to manager      |
| `avatar`      | String   | NULL                        | Profile picture URL       |
| `isActive`    | Boolean  | NOT NULL, DEFAULT: true     | Account status            |
| `lastLoginAt` | DateTime | NULL                        | Last login timestamp      |
| `createdAt`   | DateTime | NOT NULL, DEFAULT: now()    | Account creation time     |
| `updatedAt`   | DateTime | NOT NULL                    | Last update time          |

**Indexes**:

- Primary Key: `id`
- Unique: `email`
- Foreign Key: `managerId` → `users.id`

### Teams Table

**Purpose**: Represents organizational teams and departments.

| Column        | Type     | Constraints              | Description           |
| ------------- | -------- | ------------------------ | --------------------- |
| `id`          | String   | PK, CUID                 | Unique identifier     |
| `name`        | String   | NOT NULL                 | Team name             |
| `description` | String   | NULL                     | Team description      |
| `department`  | String   | NULL                     | Associated department |
| `createdAt`   | DateTime | NOT NULL, DEFAULT: now() | Team creation time    |
| `updatedAt`   | DateTime | NOT NULL                 | Last update time      |

**Indexes**:

- Primary Key: `id`

### TeamMembers Table

**Purpose**: Junction table for many-to-many relationship between users and teams.

| Column     | Type     | Constraints               | Description       |
| ---------- | -------- | ------------------------- | ----------------- |
| `id`       | String   | PK, CUID                  | Unique identifier |
| `userId`   | String   | FK, NOT NULL              | Reference to user |
| `teamId`   | String   | FK, NOT NULL              | Reference to team |
| `role`     | TeamRole | NOT NULL, DEFAULT: MEMBER | Role in the team  |
| `joinedAt` | DateTime | NOT NULL, DEFAULT: now()  | Join date         |

**Indexes**:

- Primary Key: `id`
- Unique: `[userId, teamId]`
- Foreign Keys: `userId` → `users.id`, `teamId` → `teams.id`

### Feedback Table

**Purpose**: Stores feedback exchanged between users.

| Column        | Type             | Constraints                | Description        |
| ------------- | ---------------- | -------------------------- | ------------------ |
| `id`          | String           | PK, CUID                   | Unique identifier  |
| `senderId`    | String           | FK, NOT NULL               | Feedback sender    |
| `receiverId`  | String           | FK, NOT NULL               | Feedback receiver  |
| `teamId`      | String           | FK, NULL                   | Associated team    |
| `type`        | FeedbackType     | NOT NULL, DEFAULT: PEER    | Feedback type      |
| `category`    | FeedbackCategory | NOT NULL                   | Feedback category  |
| `title`       | String           | NOT NULL                   | Feedback title     |
| `content`     | String           | NOT NULL                   | Feedback content   |
| `rating`      | Int              | NULL, 1-5                  | Numerical rating   |
| `isAnonymous` | Boolean          | NOT NULL, DEFAULT: false   | Anonymous feedback |
| `isPublic`    | Boolean          | NOT NULL, DEFAULT: false   | Public visibility  |
| `status`      | FeedbackStatus   | NOT NULL, DEFAULT: PENDING | Feedback status    |
| `createdAt`   | DateTime         | NOT NULL, DEFAULT: now()   | Creation time      |
| `updatedAt`   | DateTime         | NOT NULL                   | Last update time   |

**Indexes**:

- Primary Key: `id`
- Foreign Keys: `senderId` → `users.id`, `receiverId` → `users.id`, `teamId` → `teams.id`
- Index: `receiverId` (for querying received feedback)
- Index: `senderId` (for querying sent feedback)

### SelfAssessments Table

**Purpose**: Stores user self-assessment data.

| Column        | Type             | Constraints              | Description                         |
| ------------- | ---------------- | ------------------------ | ----------------------------------- |
| `id`          | String           | PK, CUID                 | Unique identifier                   |
| `userId`      | String           | FK, NOT NULL             | Assessment owner                    |
| `period`      | String           | NOT NULL                 | Assessment period (e.g., "Q1 2024") |
| `title`       | String           | NOT NULL                 | Assessment title                    |
| `content`     | Json             | NOT NULL                 | Structured assessment data          |
| `status`      | AssessmentStatus | NOT NULL, DEFAULT: DRAFT | Assessment status                   |
| `submittedAt` | DateTime         | NULL                     | Submission timestamp                |
| `createdAt`   | DateTime         | NOT NULL, DEFAULT: now() | Creation time                       |
| `updatedAt`   | DateTime         | NOT NULL                 | Last update time                    |

**Indexes**:

- Primary Key: `id`
- Foreign Key: `userId` → `users.id`
- Index: `userId` (for querying user assessments)

### Goals Table

**Purpose**: Tracks personal and team goals with progress monitoring.

| Column        | Type       | Constraints                    | Description          |
| ------------- | ---------- | ------------------------------ | -------------------- |
| `id`          | String     | PK, CUID                       | Unique identifier    |
| `userId`      | String     | FK, NOT NULL                   | Goal owner           |
| `teamId`      | String     | FK, NULL                       | Associated team      |
| `title`       | String     | NOT NULL                       | Goal title           |
| `description` | String     | NULL                           | Goal description     |
| `type`        | GoalType   | NOT NULL, DEFAULT: PERSONAL    | Goal type            |
| `status`      | GoalStatus | NOT NULL, DEFAULT: IN_PROGRESS | Goal status          |
| `priority`    | Priority   | NOT NULL, DEFAULT: MEDIUM      | Goal priority        |
| `startDate`   | DateTime   | NOT NULL                       | Goal start date      |
| `dueDate`     | DateTime   | NOT NULL                       | Goal due date        |
| `completedAt` | DateTime   | NULL                           | Completion timestamp |
| `progress`    | Int        | NOT NULL, DEFAULT: 0, 0-100    | Progress percentage  |
| `createdAt`   | DateTime   | NOT NULL, DEFAULT: now()       | Creation time        |
| `updatedAt`   | DateTime   | NOT NULL                       | Last update time     |

**Indexes**:

- Primary Key: `id`
- Foreign Keys: `userId` → `users.id`, `teamId` → `teams.id`
- Index: `userId` (for querying user goals)
- Index: `dueDate` (for deadline queries)

### Recognitions Table

**Purpose**: Stores public recognition and kudos between team members.

| Column       | Type            | Constraints              | Description          |
| ------------ | --------------- | ------------------------ | -------------------- |
| `id`         | String          | PK, CUID                 | Unique identifier    |
| `senderId`   | String          | FK, NOT NULL             | Recognition sender   |
| `receiverId` | String          | FK, NOT NULL             | Recognition receiver |
| `title`      | String          | NOT NULL                 | Recognition title    |
| `message`    | String          | NOT NULL                 | Recognition message  |
| `type`       | RecognitionType | NOT NULL                 | Recognition type     |
| `isPublic`   | Boolean         | NOT NULL, DEFAULT: true  | Public visibility    |
| `createdAt`  | DateTime        | NOT NULL, DEFAULT: now() | Creation time        |

**Indexes**:

- Primary Key: `id`
- Foreign Keys: `senderId` → `users.id`, `receiverId` → `users.id`
- Index: `receiverId` (for querying received recognitions)

## Enums

### UserRole

```sql
enum UserRole {
  ADMIN      -- Full system access
  MANAGER    -- Team management access
  EMPLOYEE   -- Basic user access
}
```

### TeamRole

```sql
enum TeamRole {
  LEADER     -- Team leader
  MEMBER     -- Team member
}
```

### FeedbackType

```sql
enum FeedbackType {
  PEER       -- Peer-to-peer feedback
  MANAGER    -- Manager feedback
  SELF       -- Self-assessment
  TEAM       -- Team feedback
}
```

### FeedbackCategory

```sql
enum FeedbackCategory {
  PERFORMANCE      -- Performance-related feedback
  COLLABORATION    -- Teamwork and collaboration
  LEADERSHIP       -- Leadership skills
  COMMUNICATION    -- Communication skills
  TECHNICAL_SKILLS -- Technical abilities
  INNOVATION       -- Innovation and creativity
  OTHER            -- Other categories
}
```

### FeedbackStatus

```sql
enum FeedbackStatus {
  PENDING      -- Feedback pending review
  ACKNOWLEDGED -- Feedback acknowledged
  COMPLETED    -- Feedback action completed
  ARCHIVED     -- Feedback archived
}
```

### AssessmentStatus

```sql
enum AssessmentStatus {
  DRAFT      -- Assessment in draft
  SUBMITTED  -- Assessment submitted
  REVIEWED   -- Assessment reviewed
  APPROVED   -- Assessment approved
}
```

### GoalType

```sql
enum GoalType {
  PERSONAL        -- Personal goal
  TEAM            -- Team goal
  ORGANIZATIONAL  -- Organizational goal
}
```

### GoalStatus

```sql
enum GoalStatus {
  NOT_STARTED  -- Goal not yet started
  IN_PROGRESS  -- Goal in progress
  COMPLETED    -- Goal completed
  CANCELLED    -- Goal cancelled
}
```

### Priority

```sql
enum Priority {
  LOW      -- Low priority
  MEDIUM   -- Medium priority
  HIGH     -- High priority
  URGENT   -- Urgent priority
}
```

### RecognitionType

```sql
enum RecognitionType {
  KUDOS         -- General kudos
  ACHIEVEMENT   -- Achievement recognition
  INNOVATION    -- Innovation recognition
  LEADERSHIP    -- Leadership recognition
  COLLABORATION -- Collaboration recognition
  OTHER         -- Other recognition types
}
```

## Relationships

### One-to-Many Relationships

1. **User → User** (Manager to Employee)
   - A user can have one manager
   - A user can have multiple employees
   - Self-referencing relationship via `managerId`

2. **User → Feedback** (Sender)
   - A user can send multiple feedback items
   - Each feedback has one sender

3. **User → Feedback** (Receiver)
   - A user can receive multiple feedback items
   - Each feedback has one receiver

4. **User → SelfAssessment**
   - A user can have multiple self-assessments
   - Each assessment belongs to one user

5. **User → Goal**
   - A user can have multiple goals
   - Each goal belongs to one user

6. **User → Recognition** (Sender/Receiver)
   - A user can send/receive multiple recognitions

7. **Team → TeamMember**
   - A team can have multiple members
   - Each team membership belongs to one team

8. **Team → Feedback**
   - A team can have multiple feedback items
   - Each feedback can optionally belong to one team

9. **Team → Goal**
   - A team can have multiple goals
   - Each goal can optionally belong to one team

### Many-to-Many Relationships

1. **User ↔ Team** (via TeamMember)
   - Users can belong to multiple teams
   - Teams can have multiple users
   - Junction table includes role information

## Database Operations

### Common Queries

#### Get User with Manager and Employees

```sql
SELECT
  u.*,
  m.firstName as managerFirstName,
  m.lastName as managerLastName,
  COUNT(e.id) as employeeCount
FROM users u
LEFT JOIN users m ON u.managerId = m.id
LEFT JOIN users e ON e.managerId = u.id
WHERE u.id = ?
GROUP BY u.id, m.firstName, m.lastName;
```

#### Get Team Members with Roles

```sql
SELECT
  u.id, u.firstName, u.lastName, u.role,
  tm.role as teamRole, tm.joinedAt
FROM teams t
JOIN team_members tm ON t.id = tm.teamId
JOIN users u ON tm.userId = u.id
WHERE t.id = ?
ORDER BY tm.joinedAt;
```

#### Get Feedback with Sender and Receiver

```sql
SELECT
  f.*,
  s.firstName as senderFirstName,
  s.lastName as senderLastName,
  r.firstName as receiverFirstName,
  r.lastName as receiverLastName
FROM feedback f
JOIN users s ON f.senderId = s.id
JOIN users r ON f.receiverId = r.id
WHERE f.receiverId = ?
ORDER BY f.createdAt DESC;
```

#### Get User Goals with Progress

```sql
SELECT
  g.*,
  t.name as teamName
FROM goals g
LEFT JOIN teams t ON g.teamId = t.id
WHERE g.userId = ?
ORDER BY g.dueDate;
```

### Indexes for Performance

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);

-- Feedback queries
CREATE INDEX idx_feedback_receiver ON feedback(receiverId);
CREATE INDEX idx_feedback_sender ON feedback(senderId);
CREATE INDEX idx_feedback_team ON feedback(teamId);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(createdAt);

-- Goal queries
CREATE INDEX idx_goals_user ON goals(userId);
CREATE INDEX idx_goals_team ON goals(teamId);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_due_date ON goals(dueDate);

-- Assessment queries
CREATE INDEX idx_assessments_user ON self_assessments(userId);
CREATE INDEX idx_assessments_status ON self_assessments(status);

-- Team member queries
CREATE INDEX idx_team_members_user ON team_members(userId);
CREATE INDEX idx_team_members_team ON team_members(teamId);
```

## Data Integrity

### Constraints

1. **Foreign Key Constraints**
   - All foreign keys have proper referential integrity
   - Cascade deletes where appropriate (e.g., user deletion removes their feedback)

2. **Unique Constraints**
   - Email addresses must be unique
   - User-team combinations must be unique

3. **Check Constraints**
   - Rating values must be between 1-5
   - Progress values must be between 0-100
   - Due dates must be after start dates

### Triggers (Optional)

```sql
-- Update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Backup and Recovery

### Backup Strategy

```bash
# Full database backup
pg_dump -h localhost -U postgres -d feedback_app > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump -h localhost -U postgres -d feedback_app | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
psql -h localhost -U postgres -d feedback_app < backup_file.sql
```

### Migration Strategy

1. **Development**: Use `prisma db push` for schema changes
2. **Production**: Use `prisma migrate dev` for versioned migrations
3. **Testing**: Always test migrations on staging environment first

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt
2. **Data Encryption**: Sensitive data should be encrypted at rest
3. **Access Control**: Row-level security can be implemented for multi-tenant scenarios
4. **Audit Trail**: Consider adding audit tables for sensitive operations
5. **Backup Encryption**: Encrypt database backups
