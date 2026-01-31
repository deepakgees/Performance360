# Production Deployment Guide - Database Migrations

## Overview

This guide covers deploying the following database changes to production:

1. **New Table**: `sessions` - Session tracking table
2. **New Column**: `monthly_attendance.leaveNotificationsInTeamsChannel` - New field for tracking leave notifications in Teams channel

Both changes are **non-destructive** and **safe** to deploy:
- Creating a new table does not affect existing data
- Adding a column with a default value (0) ensures existing rows are automatically populated

## Pre-Deployment Checklist

### 1. Backup Production Database ⚠️ **CRITICAL**

**ALWAYS create a full database backup before running migrations in production.**

```bash
# Using pg_dump (PostgreSQL)
pg_dump -h <your-db-host> -U <your-db-user> -d <your-db-name> -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Or using psql
pg_dump -h <your-db-host> -U <your-db-user> -d <your-db-name> > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created successfully
ls -lh backup_*.dump
```

**Alternative**: If using a managed database service (AWS RDS, Railway, DigitalOcean, etc.), use their backup/export feature.

### 2. Verify Current Database State

Check which migrations have already been applied:

```bash
# Connect to production database
psql -h <your-db-host> -U <your-db-user> -d <your-db-name>

# Check migration history
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 10;
```

### 3. Test Migrations in Staging (Recommended)

If you have a staging environment that mirrors production:
1. Run migrations on staging first
2. Verify application works correctly
3. Check data integrity

## Deployment Steps

### Step 1: Prepare Production Environment

1. **SSH into your production server** (if applicable)
2. **Navigate to the backend directory**
   ```bash
   cd /path/to/your/app/backend
   ```

3. **Ensure you're on the correct branch/commit**
   ```bash
   git pull origin main  # or your production branch
   git log --oneline -5  # Verify you have the latest changes
   ```

4. **Verify environment variables are set**
   ```bash
   # Check DATABASE_URL is pointing to production
   echo $DATABASE_URL
   # Should show your production database connection string
   ```

### Step 2: Install Dependencies (if needed)

```bash
npm install
```

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

This ensures the Prisma client is up-to-date with the schema changes.

### Step 4: Run Database Migrations

**For Production, use `prisma migrate deploy`** (NOT `prisma migrate dev`)

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Run migrations
npx prisma migrate deploy
```

**What this does:**
- Applies pending migrations to the database
- Updates the `_prisma_migrations` table
- Does NOT create new migration files (safe for production)
- Runs in a transaction (rolls back on error)

**Expected Output:**
```
Applying migration `20250111_add_session_tracking`
Applying migration `20250111_add_leave_notifications_in_teams_channel`

The following migration(s) have been applied:

migrations/
  └─ 20250111_add_session_tracking/
      └─ migration.sql
  └─ 20250111_add_leave_notifications_in_teams_channel/
      └─ migration.sql

All migrations have been successfully applied.
```

### Step 5: Verify Migrations

1. **Check migration status**
   ```bash
   npx prisma migrate status
   ```
   Should show: "Database schema is up to date!"

2. **Verify tables/columns exist**
   ```bash
   # Connect to database
   psql -h <your-db-host> -U <your-db-user> -d <your-db-name>
   
   # Check sessions table exists
   \d sessions
   
   # Check monthly_attendance table has new column
   \d monthly_attendance
   # Should see: leaveNotificationsInTeamsChannel | double precision | not null default 0
   ```

3. **Verify data integrity**
   ```sql
   -- Check existing monthly_attendance records have the new column with default value
   SELECT COUNT(*) as total_records,
          COUNT(leaveNotificationsInTeamsChannel) as records_with_new_field
   FROM monthly_attendance;
   -- Both counts should match
   
   -- Verify all existing records have default value of 0
   SELECT COUNT(*) 
   FROM monthly_attendance 
   WHERE leaveNotificationsInTeamsChannel != 0;
   -- Should return 0 (or only new records if any were created)
   ```

### Step 6: Deploy Application Code

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Restart the application**
   
   **If using PM2:**
   ```bash
   npm run restart:pm2
   # Or
   pm2 restart feedback-app-backend
   ```
   
   **If using systemd:**
   ```bash
   sudo systemctl restart your-app-service
   ```
   
   **If using Docker:**
   ```bash
   docker-compose restart backend
   # Or rebuild and restart
   docker-compose up -d --build backend
   ```

3. **Monitor application logs**
   ```bash
   # PM2
   pm2 logs feedback-app-backend --lines 50
   
   # Docker
   docker-compose logs -f backend
   
   # Systemd
   journalctl -u your-app-service -f
   ```

### Step 7: Post-Deployment Verification

1. **Health Check**
   - Visit your health check endpoint (if available)
   - Verify API is responding

2. **Test New Features**
   - Test session tracking functionality
   - Verify monthly attendance with new field works correctly
   - Check admin session management (if applicable)

3. **Monitor for Errors**
   - Watch application logs for any database-related errors
   - Check for any Prisma client errors
   - Monitor error tracking (Sentry, etc.)

## Rollback Plan (If Needed)

If something goes wrong, follow these steps:

### 1. Stop the Application
```bash
pm2 stop feedback-app-backend
# or
sudo systemctl stop your-app-service
```

### 2. Restore Database from Backup
```bash
# Restore from backup
pg_restore -h <your-db-host> -U <your-db-user> -d <your-db-name> -c backup_YYYYMMDD_HHMMSS.dump

# Or using psql
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> < backup_YYYYMMDD_HHMMSS.sql
```

### 3. Revert Code Changes
```bash
git checkout <previous-commit-hash>
npm install
npm run build
```

### 4. Restart Application
```bash
pm2 restart feedback-app-backend
```

## Migration Details

### Migration 1: `20250111_add_session_tracking`

**Creates:**
- New `sessions` table with the following structure:
  - `id` (TEXT, PRIMARY KEY)
  - `userId` (TEXT, Foreign Key to users)
  - `token` (TEXT)
  - `ipAddress` (TEXT, nullable)
  - `userAgent` (TEXT, nullable)
  - `lastActivityAt` (TIMESTAMP)
  - `expiresAt` (TIMESTAMP)
  - `isActive` (BOOLEAN, default: true)
  - `createdAt` (TIMESTAMP)
  - `updatedAt` (TIMESTAMP)
- Indexes on: `userId`, `isActive`, `expiresAt`, `(userId, isActive)`
- Foreign key constraint to `users` table

**Impact:** None on existing data (new table)

### Migration 2: `20250111_add_leave_notifications_in_teams_channel`

**Adds:**
- New column `leaveNotificationsInTeamsChannel` to `monthly_attendance` table
- Type: `DOUBLE PRECISION`
- Constraint: `NOT NULL DEFAULT 0`

**Impact:** 
- All existing rows automatically get value `0`
- No data loss
- No breaking changes to existing queries (column is nullable-safe with default)

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** The migration may have partially run. Check migration status:
```bash
npx prisma migrate status
```

If the migration shows as applied but table doesn't exist, you may need to manually create it or restore from backup.

### Issue: Column already exists

**Solution:** Similar to above, check migration status. If column exists but migration shows as pending, you may need to mark it as applied manually (not recommended - prefer restoring from backup).

### Issue: Foreign key constraint fails

**Solution:** Ensure `users` table exists and has the `id` column. This should not happen if previous migrations were applied correctly.

### Issue: Application errors after migration

**Solution:**
1. Check Prisma client is regenerated: `npm run db:generate`
2. Verify application is rebuilt: `npm run build`
3. Check application logs for specific error messages
4. Verify DATABASE_URL is correct

## Best Practices

1. **Always backup before migrations** - This cannot be stressed enough
2. **Test in staging first** - Mirror production environment
3. **Deploy during low-traffic periods** - Minimize impact
4. **Monitor after deployment** - Watch for errors/issues
5. **Have rollback plan ready** - Know how to revert if needed
6. **Document changes** - Keep track of what was deployed
7. **Use transactions** - Prisma migrations run in transactions by default
8. **Verify in production** - Don't assume it worked, verify it

## Additional Notes

- These migrations are **idempotent** - Running them multiple times should be safe (Prisma tracks applied migrations)
- The migrations use **transactions** - If any step fails, the entire migration rolls back
- **No downtime required** - These changes can be applied with zero downtime
- **Backward compatible** - Existing application code will continue to work (new column has default value)

## Support

If you encounter issues:
1. Check Prisma migration logs
2. Review application error logs
3. Verify database connection
4. Check Prisma documentation: https://www.prisma.io/docs/guides/migrate/production-troubleshooting

---

**Last Updated:** 2025-01-11
**Migrations Included:**
- `20250111_add_session_tracking`
- `20250111_add_leave_notifications_in_teams_channel`
