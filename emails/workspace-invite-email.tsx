import * as React from "react";

import { BaseTemplate } from "@/emails/base-template";

type WorkspaceInviteEmailProps = {
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiryDate: string;
  brandLogoUrl: string;
};

export function WorkspaceInviteEmail(props: WorkspaceInviteEmailProps) {
  return (
    <BaseTemplate
      preview="Access your workspace and complete your account setup."
      heading="You’ve been invited to join Flow"
      greeting="Hello,"
      context={`You have been invited to join the ${props.workspaceName} workspace in Flow Platform as ${props.role}.`}
      ctaLabel="Accept Invitation"
      ctaUrl={props.inviteUrl}
      fallbackLabel="If the button does not work, use this link"
      brandLogoUrl={props.brandLogoUrl}
      brandSlogan="X-Labs Technology Teams Management"
      footer={`This invitation expires on ${props.expiryDate}. If you were not expecting this email, you can ignore it.`}
    />
  );
}
