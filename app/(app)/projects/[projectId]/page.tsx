import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { requireCurrentMembership } from "@/modules/auth/server";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    assignee?: string;
    q?: string;
    task?: string;
  }>;
}) {
  const membership = await requireCurrentMembership();
  const { projectId } = await params;
  const { assignee, q, task } = await searchParams;

  return (
    <ProjectsWorkspace
      assigneeMembershipId={assignee}
      search={q}
      selectedProjectId={projectId}
      selectedTaskId={task}
      workspaceId={membership.workspaceId}
    />
  );
}
