import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { requireCurrentMembership } from "@/modules/auth/server";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const membership = await requireCurrentMembership();
  const { projectId } = await params;

  return <ProjectsWorkspace selectedProjectId={projectId} workspaceId={membership.workspaceId} />;
}
