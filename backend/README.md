# Performance360 Backend

A comprehensive backend API for a performance management and feedback application built with Node.js, Express, TypeScript, and Prisma ORM.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **User Management** - Admin tools for managing users and their relationships
- **Feedback System** - Comprehensive feedback collection and management
- **Self-Assessments** - Personal performance evaluation tools
- **Reporting** - Direct and indirect reports management
- **Security Features** - Rate limiting, CORS, Helmet, input validation
- **Database** - PostgreSQL with Prisma ORM for type-safe database operations

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd performance360/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/feedback_app"

   # JWT
   JWT_SECRET="your-super-secret-jwt-key-here"

   # Server
   PORT=5000
   NODE_ENV=development

   # Frontend URL (for CORS)
   FRONTEND_URL="http://localhost:3000"

   # Email (optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or run migrations (recommended for production)
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication (`/auth`)

| Method | Endpoint         | Description         | Body                                              |
| ------ | ---------------- | ------------------- | ------------------------------------------------- |
| POST   | `/auth/register` | Register a new user | `{ email, password, firstName, lastName, role? }` |
| POST   | `/auth/login`    | Login user          | `{ email, password }`                             |

**Register Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE",
    "department": null,
    "position": null
  },
  "token": "jwt_token_here"
}
```

#### Users (`/users`)

| Method | Endpoint         | Description                   | Auth Required |
| ------ | ---------------- | ----------------------------- | ------------- |
| GET    | `/users/profile` | Get current user profile      | Yes           |
| PUT    | `/users/profile` | Update user profile           | Yes           |
| GET    | `/users`         | Get all users (Admin/Manager) | Yes           |
| GET    | `/users/:id`     | Get user by ID                | Yes           |

#### Colleague Feedback (`/colleague-feedback`)

| Method | Endpoint                         | Description                   | Auth Required |
| ------ | -------------------------------- | ----------------------------- | ------------- |
| GET    | `/colleague-feedback/received`   | Get feedback received by user | Yes           |
| GET    | `/colleague-feedback/sent`       | Get feedback sent by user     | Yes           |
| POST   | `/colleague-feedback`            | Create new colleague feedback | Yes           |
| PATCH  | `/colleague-feedback/:id/status` | Update feedback status        | Yes           |

#### Manager Feedback (`/manager-feedback`)

| Method | Endpoint                       | Description                   | Auth Required |
| ------ | ------------------------------ | ----------------------------- | ------------- |
| GET    | `/manager-feedback/received`   | Get manager feedback received | Yes           |
| GET    | `/manager-feedback/sent`       | Get manager feedback sent     | Yes           |
| POST   | `/manager-feedback`            | Create new manager feedback   | Yes           |

#### Self-Assessments (`/assessments`)

| Method | Endpoint                  | Description                 | Auth Required |
| ------ | ------------------------- | --------------------------- | ------------- |
| GET    | `/assessments`            | Get user's self-assessments | Yes           |
| POST   | `/assessments`            | Create new self-assessment  | Yes           |
| GET    | `/assessments/:id`        | Get assessment by ID        | Yes           |
| PUT    | `/assessments/:id`        | Update assessment           | Yes           |
| PATCH  | `/assessments/:id/submit` | Submit assessment           | Yes           |

## 🗄️ Database Schema

### Core Models

#### User

- `id` - Unique identifier
- `email` - User email (unique)
- `firstName`, `lastName` - User names
- `password` - Hashed password
- `role` - ADMIN, MANAGER, or EMPLOYEE
- `department`, `position` - Optional user details
- `managerId` - Reference to manager (self-referencing)
- `avatar` - Profile picture URL
- `isActive` - Account status
- `lastLoginAt` - Last login timestamp

#### ColleagueFeedback

- `id` - Unique identifier
- `senderId` - Reference to sender user
- `receiverId` - Reference to receiver user
- `feedbackType` - Type of feedback (COLLEAGUE)
- `rating` - Numerical rating (1-5)
- `year` - Feedback year
- `quarter` - Feedback quarter (Q1, Q2, Q3, Q4)
- `isAnonymous` - Whether feedback is anonymous
- `isPublic` - Whether feedback is public
- `status` - Feedback status
- `feedbackProvider` - Name of feedback provider
- `appreciation` - What you appreciate about the colleague
- `improvement` - Areas for improvement
- `wouldWorkAgain` - Would you work with them again
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Indexes**:

- Primary Key: `id`
- Foreign Keys: `senderId` → `users.id`, `receiverId` → `users.id`

#### ManagerFeedback

- `id` - Unique identifier
- `senderId`, `receiverId` - User references
- `teamId` - Optional team reference
- `year`, `quarter` - Feedback period
- `isAnonymous`, `isPublic` - Visibility settings
- `status` - PENDING, ACKNOWLEDGED, COMPLETED, ARCHIVED
- `feedbackProvider` - Name of the feedback provider
- `managerSatisfaction` - Manager satisfaction level
- `managerAreas` - JSON object with strengths and areas for improvement
- `leadershipStyle` - Leadership style questions
- `careerGrowth` - Career growth questions
- `coachingCaring` - Coaching and caring questions
- `managerOverallRating` - Overall rating

#### SelfAssessment

- `id` - Unique identifier
- `userId` - User reference
- `period` - Assessment period (e.g., "Q1 2024")
- `title` - Assessment title
- `content` - JSON structured assessment data
- `status` - DRAFT, SUBMITTED, REVIEWED, APPROVED

## 🔐 Security Features

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Token expiration (24 hours)

### Authorization

- Role-based access control (ADMIN, MANAGER, EMPLOYEE)
- Middleware for protecting routes
- User-specific data access

### Security Middleware

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Express-validator for request validation
- **SQL Injection Protection** - Prisma ORM with parameterized queries

## 🚀 Deployment

### Production Setup

1. **Environment Variables**

   ```bash
   NODE_ENV=production
   DATABASE_URL="your-production-database-url"
   JWT_SECRET="your-production-jwt-secret"
   FRONTEND_URL="your-frontend-url"
   ```

2. **Build the application**

   ```bash
   npm run build
   ```

3. **Database migration**

   ```bash
   npm run db:migrate
   ```

4. **Start production server**
   ```bash
   npm start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 📝 Available Scripts

| Script                | Description                           |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start development server with nodemon |
| `npm run build`       | Build TypeScript to JavaScript        |
| `npm start`           | Start production server               |
| `npm run db:generate` | Generate Prisma client                |
| `npm run db:push`     | Push schema to database               |
| `npm run db:migrate`  | Run database migrations               |
| `npm run db:studio`   | Open Prisma Studio                    |

## 🧪 Testing

The application includes comprehensive error handling and validation. For testing:

1. **Unit Tests** - Add Jest or Mocha for unit testing
2. **Integration Tests** - Test API endpoints with Supertest
3. **Database Tests** - Use test database for isolated testing

## 📊 Monitoring & Logging

- Console logging for development
- Error handling middleware
- Health check endpoint at `/health`
- Consider adding Winston or Pino for production logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the database schema
- Test with the provided endpoints

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

### ColleagueFeedback Table

**Purpose**: Stores feedback exchanged between colleagues.

| Column             | Type           | Constraints                  | Description                       |
| ------------------ | -------------- | ---------------------------- | --------------------------------- |
| `id`               | String         | PK, CUID                     | Unique identifier                 |
| `senderId`         | String         | FK, NOT NULL                 | Feedback sender                   |
| `receiverId`       | String         | FK, NOT NULL                 | Feedback receiver                 |
| `teamId`           | String         | FK, NULL                     | Associated team                   |
| `feedbackType`     | FeedbackType   | NOT NULL, DEFAULT: COLLEAGUE | Feedback type                     |
| `rating`           | Int            | NULL, 1-5                    | Numerical rating                  |
| `year`             | String         | NOT NULL                     | Feedback year                     |
| `quarter`          | String         | NOT NULL                     | Feedback quarter                  |
| `isAnonymous`      | Boolean        | NOT NULL, DEFAULT: false     | Anonymous feedback                |
| `isPublic`         | Boolean        | NOT NULL, DEFAULT: false     | Public visibility                 |
| `status`           | FeedbackStatus | NOT NULL, DEFAULT: PENDING   | Feedback status                   |
| `feedbackProvider` | String         | NOT NULL                     | Name of the feedback provider     |
| `appreciation`     | String         | NULL                         | What do you appreciate most       |
| `improvement`      | String         | NULL                         | What could this colleague improve |
| `wouldWorkAgain`   | Boolean        | NULL                         | Would you work with them again    |
| `createdAt`        | DateTime       | NOT NULL, DEFAULT: now()     | Creation time                     |
| `updatedAt`        | DateTime       | NOT NULL                     | Last update time                  |

**Indexes**:

- Primary Key: `id`
- Foreign Keys: `senderId` → `users.id`, `receiverId` → `users.id`
- Index: `receiverId` (for querying received feedback)
- Index: `senderId` (for querying sent feedback)

### ManagerFeedback Table

**Purpose**: Stores feedback for managers.

| Column                 | Type           | Constraints                | Description                         |
| ---------------------- | -------------- | -------------------------- | ----------------------------------- |
| `id`                   | String         | PK, CUID                   | Unique identifier                   |
| `senderId`             | String         | FK, NOT NULL               | Feedback sender                     |
| `receiverId`           | String         | FK, NOT NULL               | Feedback receiver                   |
| `teamId`               | String         | FK, NULL                   | Associated team                     |
| `year`                 | String         | NOT NULL                   | Feedback year                       |
| `quarter`              | String         | NOT NULL                   | Feedback quarter                    |
| `isAnonymous`          | Boolean        | NOT NULL, DEFAULT: false   | Anonymous feedback                  |
| `isPublic`             | Boolean        | NOT NULL, DEFAULT: false   | Public visibility                   |
| `status`               | FeedbackStatus | NOT NULL, DEFAULT: PENDING | Feedback status                     |
| `feedbackProvider`     | String         | NOT NULL                   | Name of the feedback provider       |
| `managerSatisfaction`  | String         | NULL                       | Manager satisfaction level          |
| `managerAreas`         | Json           | NULL                       | Strengths and areas for improvement |
| `leadershipStyle`      | Json           | NULL                       | Leadership style Q1                 |
| `careerGrowth`         | Json           | NULL                       | Career growth Q1                    |
| `coachingCaring`       | Json           | NULL                       | Coaching and caring                 |
| `managerOverallRating` | Int            | NULL                       | Overall rating                      |
| `createdAt`            | DateTime       | NOT NULL, DEFAULT: now()   | Creation time                       |
| `updatedAt`            | DateTime       | NOT NULL                   | Last update time                    |

**Indexes**:

- Primary Key: `id`
- Foreign Keys: `senderId` → `users.id`, `receiverId` → `users.id`
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
- Foreign Keys: `userId` → `users.id`
- Index: `userId` (for querying user goals)
- Index: `dueDate` (for deadline queries)

## Enums

### UserRole

```sql
enum UserRole {
  ADMIN      -- Full system access
  MANAGER    -- Team management access
  EMPLOYEE   -- Basic user access
}
```

### FeedbackType

```sql
enum FeedbackType {
  COLLEAGUE       -- Colleague-to-colleague feedback
  MANAGER         -- Manager feedback
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
