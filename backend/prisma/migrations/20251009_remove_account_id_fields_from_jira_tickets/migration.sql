-- Remove unused accountId fields from jira_tickets table
ALTER TABLE "jira_tickets" DROP COLUMN IF EXISTS "assigneeAccountId";
ALTER TABLE "jira_tickets" DROP COLUMN IF EXISTS "reporterAccountId";
