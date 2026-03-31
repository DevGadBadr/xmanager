import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { requireCurrentMembership } from "@/modules/auth/server";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const membership = await requireCurrentMembership();
  const { folder } = await searchParams;

  return (
    <ProjectsWorkspace
      selectedFolderId={folder}
      workspaceId={membership.workspaceId}
    />
  );
}
