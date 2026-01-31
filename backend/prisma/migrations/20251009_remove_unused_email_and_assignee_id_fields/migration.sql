-- Remove unused fields from jira_tickets table
ALTER TABLE "jira_tickets" DROP COLUMN IF EXISTS "assigneeEmail";
ALTER TABLE "jira_tickets" DROP COLUMN IF EXISTS "reporterEmail";
ALTER TABLE "jira_tickets" DROP COLUMN IF EXISTS "assigneeId";
