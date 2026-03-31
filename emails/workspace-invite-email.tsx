import * as React from "react";

import { BaseTemplate } from "@/emails/base-template";

type WorkspaceInviteEmailProps = {
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiryDate: string;
};

export function WorkspaceInviteEmail(props: WorkspaceInviteEmailProps) {
  return (
    <BaseTemplate
      preview="Access your workspace and complete your account setup."
      heading="You’ve been invited to join x-wrike"
      greeting="Hello,"
      context={`You have been invited to join the ${props.workspaceName} workspace in x-wrike as ${props.role}.`}
      ctaLabel="Accept Invitation"
      ctaUrl={props.inviteUrl}
      fallbackLabel="If the button does not work, use this link"
      footer={`This invitation expires on ${props.expiryDate}. If you were not expecting this email, you can ignore it.`}
    />
  );
}
