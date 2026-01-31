-- AlterTable
-- Remove isAnonymous, isPublic, and status columns
ALTER TABLE "manager_feedback" DROP COLUMN IF EXISTS "isAnonymous";
ALTER TABLE "manager_feedback" DROP COLUMN IF EXISTS "isPublic";
ALTER TABLE "manager_feedback" DROP COLUMN IF EXISTS "status";

-- Rename additionalFeedback to appreciation
ALTER TABLE "manager_feedback" RENAME COLUMN "additionalFeedback" TO "appreciation";

-- Add improvementAreas column
ALTER TABLE "manager_feedback" ADD COLUMN "improvementAreas" TEXT;


