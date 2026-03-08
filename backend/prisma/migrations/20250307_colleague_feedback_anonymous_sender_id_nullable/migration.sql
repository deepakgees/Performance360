-- AlterTable
-- Make senderId nullable so anonymous feedback is non-traceable (no sender stored)
ALTER TABLE "colleague_feedback" ALTER COLUMN "senderId" DROP NOT NULL;

-- Data migration: anonymize existing anonymous rows (remove sender link)
UPDATE "colleague_feedback" SET "senderId" = NULL WHERE "isAnonymous" = true;
