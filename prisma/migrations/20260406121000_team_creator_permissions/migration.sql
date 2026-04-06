-- AlterTable
ALTER TABLE "Team" ADD COLUMN "creatorMembershipId" TEXT;

-- Backfill from current manager where available.
UPDATE "Team"
SET "creatorMembershipId" = "managerMembershipId"
WHERE "creatorMembershipId" IS NULL
  AND "managerMembershipId" IS NOT NULL;

-- Backfill from the earliest linked team member when no manager is set.
UPDATE "Team" AS team
SET "creatorMembershipId" = first_member."membershipId"
FROM (
  SELECT DISTINCT ON ("teamId") "teamId", "membershipId"
  FROM "TeamMember"
  ORDER BY "teamId", "joinedAt" ASC, "id" ASC
) AS first_member
WHERE team."id" = first_member."teamId"
  AND team."creatorMembershipId" IS NULL;

-- Final fallback to the workspace owner membership.
UPDATE "Team" AS team
SET "creatorMembershipId" = membership."id"
FROM "Workspace" AS workspace
JOIN "Membership" AS membership
  ON membership."workspaceId" = workspace."id"
 AND membership."userId" = workspace."ownerUserId"
WHERE team."workspaceId" = workspace."id"
  AND team."creatorMembershipId" IS NULL;

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "creatorMembershipId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Team_creatorMembershipId_idx" ON "Team"("creatorMembershipId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_creatorMembershipId_fkey" FOREIGN KEY ("creatorMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
