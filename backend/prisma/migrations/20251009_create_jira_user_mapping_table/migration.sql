-- CreateTable
CREATE TABLE "jira_user_mappings" (
    "id" TEXT NOT NULL,
    "jiraUsername" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jira_user_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jira_user_mappings_jiraUsername_key" ON "jira_user_mappings"("jiraUsername");

-- AddForeignKey
ALTER TABLE "jira_user_mappings" ADD CONSTRAINT "jira_user_mappings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
