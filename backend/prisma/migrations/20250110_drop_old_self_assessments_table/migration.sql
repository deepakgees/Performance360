-- DropTable
DROP TABLE IF EXISTS "self_assessments" CASCADE;

-- DropEnum (only if not used by other tables)
-- Note: AssessmentStatus enum was only used by self_assessments table
-- If it's used elsewhere, this will fail and you'll need to remove it manually
DROP TYPE IF EXISTS "AssessmentStatus";

