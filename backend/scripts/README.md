# Backend Scripts

This directory contains utility scripts for database management, seeding, and development testing.

## Scripts

### Database Seeding

- `seed-database.js` - JavaScript version of the seeding script
- `seed-database.ts` - TypeScript version of the seeding script (recommended)
- `seed-achievements.js` - Seed achievements data
- `seed-manager-feedback.js` - Seed manager feedback data
- `seed.sh` - Shell script for seeding

### Database Migration

- `migrate-self-assessments.js` - Migrate self-assessments data

### Test Utilities

See [`test-utilities/README.md`](./test-utilities/README.md) for manual testing and demonstration utilities.

## Usage

### Prerequisites

1. Make sure your database is running and accessible
2. Ensure your `.env` file has the correct `DATABASE_URL`
3. Run database migrations: `npm run db:migrate`

### Running the Seeding Script

#### Option 1: Using npm scripts (Recommended)

```bash
# Using JavaScript version
npm run db:seed

# Using TypeScript version
npm run db:seed:ts

# Reset database and seed (push schema + seed)
npm run db:reset
```

#### Option 2: Direct execution

```bash
# JavaScript version
node scripts/seed-database.js

# TypeScript version
npx ts-node scripts/seed-database.ts
```

## What Gets Created

The seeding script creates the following sample data:

### Users (3 total)

- admin@company.com (ADMIN)
- manager@company.com (MANAGER)
- employee@company.com (EMPLOYEE)

### Feedback (6 total)

- 3 colleague feedback items
- 3 manager feedback items

### Self-Assessments (3 total)

- One assessment per user

## Sample Login Credentials

After running the seeding script, you can use these credentials to test the application:
