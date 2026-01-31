# Performance360

A comprehensive performance management and feedback application built with React, TypeScript, and Node.js.

## Features

- **User Authentication**: Secure login/registration with JWT tokens
- **Role-based Access**: Admin, Manager, and Employee roles with different permissions
- **Feedback System**: Colleague and manager feedback with status tracking
- **Self-Assessments**: Quarterly self-assessment system with detailed reporting
- **Team Management**: Team creation and member management
- **User Management**: Admin tools for user management and password reset
- **Responsive Design**: Modern UI built with Tailwind CSS

## Project Structure

```
employee-feedback-app/
├── backend/              # Backend API (Node.js/Express)
├── frontend/             # Frontend application (React/TypeScript)
├── docs/                 # Project documentation
│   ├── security/         # Security documentation
│   └── features/         # Feature-specific documentation
├── scripts/              # Utility scripts
│   ├── database/         # Database scripts
│   └── development/      # Development utilities
└── tests/                # All test suites
    ├── playwright-tests/ # End-to-end tests
    └── security-tests/   # Security test suite
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd performance360
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up the database**

   ```bash
   cd ../backend
   # Copy environment file
   cp env.example .env

   # Update .env with your database credentials
   # Then run database setup
   npm run db:push
   npm run db:seed
   ```

4. **Start the development servers**

   ```bash
   # Start backend (from backend directory)
   npm run dev

   # Start frontend (from frontend directory)
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Network Access Configuration

To allow the application to be accessed from different machines on your network, you need to configure CORS settings.

### Backend Configuration

1. **Update the backend environment file** (`backend/.env`):

   ```env
   # Add your machine's IP address to allowed origins
   ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://YOUR_IP_ADDRESS:3000"

   # Example for IP 192.168.1.100:
   # ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.100:3000"
   ```

2. **Restart the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

### Frontend Configuration

1. **Create a frontend environment file** (`frontend/.env`):

   ```env
   # Set the backend API URL to your machine's IP address
   REACT_APP_API_URL=http://YOUR_IP_ADDRESS:5000

   # Example for IP 192.168.1.100:
   # REACT_APP_API_URL=http://192.168.1.100:5000
   ```

2. **Restart the frontend server**:
   ```bash
   cd frontend
   npm start
   ```

### Access from Other Machines

Once configured, other machines on your network can access the app at:

- **Frontend**: `http://YOUR_IP_ADDRESS:3000`
- **Backend API**: `http://YOUR_IP_ADDRESS:5000`

### Security Considerations

- **Development Only**: This configuration is for development purposes
- **Firewall**: Ensure your firewall allows connections on ports 3000 and 5000
- **Production**: For production deployment, use proper domain names and HTTPS

## Documentation

- **[Main Documentation](./docs/README.md)** - Overview of all documentation
- **[Security Documentation](./docs/security/)** - Security audits, fixes, and testing
- **[Feature Documentation](./docs/features/)** - Feature-specific guides
- **[Backend API Documentation](./backend/API_DOCUMENTATION.md)** - Complete API reference
- **[Database Schema](./backend/DATABASE_SCHEMA.md)** - Database structure

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### User Management (Admin Only)

- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/:id/reset-password` - Reset user password
- `PATCH /api/users/:id/manager` - Update user's manager
- `DELETE /api/users/:id` - Delete user

### Feedback Endpoints

- `GET /api/colleague-feedback/received` - Get received colleague feedback
- `GET /api/colleague-feedback/sent` - Get sent colleague feedback
- `POST /api/colleague-feedback` - Create colleague feedback
- `GET /api/manager-feedback/received` - Get received manager feedback
- `GET /api/manager-feedback/sent` - Get sent manager feedback
- `POST /api/manager-feedback` - Create manager feedback

### Assessment Endpoints

- `GET /api/assessments` - Get user's assessments
- `GET /api/assessments/user/:userId` - Get assessments for specific user
- `POST /api/assessments` - Create new assessment
- `PUT /api/assessments/:id` - Update assessment
- `PATCH /api/assessments/:id/submit` - Submit assessment

## Development

### Project Structure

```
performance360/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── scripts/            # Database seeding scripts
├── frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API service functions
│   └── public/             # Static assets
├── docs/                   # Project documentation
│   ├── security/           # Security documentation
│   └── features/           # Feature-specific documentation
├── scripts/                # Utility scripts
│   ├── database/           # Database scripts
│   └── development/        # Development utilities
└── tests/                  # All test suites
    ├── playwright-tests/   # End-to-end tests
    └── security-tests/      # Security test suite
```

### Available Scripts

**Backend:**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:seed` - Seed database with test data

**Frontend:**

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

**Testing:**

- `cd tests/playwright-tests && npm test` - Run end-to-end tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
