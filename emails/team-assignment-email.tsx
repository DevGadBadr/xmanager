import * as React from "react";

import { BaseTemplate } from "@/emails/base-template";

type TeamAssignmentEmailProps = {
  fullName: string;
  teamName: string;
  workspaceName: string;
  workspaceUrl: string;
};

export function TeamAssignmentEmail(props: TeamAssignmentEmailProps) {
  return (
    <BaseTemplate
      preview="Your team membership has been updated in Flow."
      heading={`You’ve been added to the ${props.teamName} team`}
      greeting={`Hello ${props.fullName},`}
      context={`You were assigned to the ${props.teamName} team in the ${props.workspaceName} workspace.`}
      ctaLabel="Open Workspace"
      ctaUrl={props.workspaceUrl}
      fallbackLabel="Open Flow"
      footer="This is an automated notification from Flow."
    />
  );
}
