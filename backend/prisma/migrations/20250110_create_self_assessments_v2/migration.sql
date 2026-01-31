-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SatisfactionLevel" AS ENUM ('VERY_SATISFIED', 'SOMEWHAT_SATISFIED', 'NEITHER', 'SOMEWHAT_DISSATISFIED', 'VERY_DISSATISFIED');

-- CreateTable
CREATE TABLE "self_assessments_v2" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" "Quarter",
    "rating" INTEGER,
    "achievements" TEXT,
    "improvements" TEXT,
    "satisfactionLevel" "SatisfactionLevel",
    "aspirations" TEXT,
    "suggestionsForTeam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "self_assessments_v2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "self_assessments_v2_userId_idx" ON "self_assessments_v2"("userId");

-- CreateIndex
CREATE INDEX "self_assessments_v2_userId_year_quarter_idx" ON "self_assessments_v2"("userId", "year", "quarter");

-- CreateIndex
CREATE INDEX "self_assessments_v2_year_quarter_idx" ON "self_assessments_v2"("year", "quarter");

-- CreateIndex
CREATE INDEX "self_assessments_v2_rating_idx" ON "self_assessments_v2"("rating");

-- CreateIndex
CREATE INDEX "self_assessments_v2_satisfactionLevel_idx" ON "self_assessments_v2"("satisfactionLevel");

-- CreateIndex
CREATE UNIQUE INDEX "self_assessments_v2_userId_year_quarter_key" ON "self_assessments_v2"("userId", "year", "quarter");

-- AddForeignKey
ALTER TABLE "self_assessments_v2" ADD CONSTRAINT "self_assessments_v2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

