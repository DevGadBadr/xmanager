CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TaskAssignment" ("id", "taskId", "membershipId", "createdAt")
SELECT
    'ta_' || md5("id" || '-' || "assigneeMembershipId"),
    "id",
    "assigneeMembershipId",
    CURRENT_TIMESTAMP
FROM "Task"
WHERE "assigneeMembershipId" IS NOT NULL;

CREATE UNIQUE INDEX "TaskAssignment_taskId_membershipId_key" ON "TaskAssignment"("taskId", "membershipId");
CREATE INDEX "TaskAssignment_membershipId_idx" ON "TaskAssignment"("membershipId");

ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "Task_assigneeMembershipId_status_idx";
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeMembershipId_fkey";
ALTER TABLE "Task" DROP COLUMN "assigneeMembershipId";
