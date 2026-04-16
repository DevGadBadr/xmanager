import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { addHours } from "date-fns";
import type React from "react";

import { TeamAssignmentEmail } from "@/emails/team-assignment-email";
import { TaskAssignmentEmail } from "@/emails/task-assignment-email";
import { PasswordResetCodeEmail } from "@/emails/password-reset-code-email";
import { TaskReassignmentEmail } from "@/emails/task-reassignment-email";
import { WelcomeEmail } from "@/emails/welcome-email";
import { WorkspaceInviteEmail } from "@/emails/workspace-invite-email";
import { ensureAppPath } from "@/lib/auth-path";
import { getEnv } from "@/lib/env";
import { formatDate } from "@/lib/utils";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const env = getEnv();

  transporter = nodemailer.createTransport({
    host: env.MAILTRAP_HOST,
    port: env.MAILTRAP_PORT,
    auth: {
      user: env.MAILTRAP_USERNAME,
      pass: env.MAILTRAP_PASSWORD,
    },
  });

  return transporter;
}

async function sendMail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  const env = getEnv();
  const html = await render(react);

  await getTransporter().sendMail({
    to,
    subject,
    from: `${env.MAIL_FROM_NAME} <${env.MAIL_FROM_EMAIL}>`,
    html,
  });
}

export async function sendWorkspaceInviteEmail({
  to,
  workspaceName,
  role,
  inviteUrl,
}: {
  to: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
}) {
  const env = getEnv();
  const expiryDate = formatDate(addHours(new Date(), env.INVITE_TOKEN_TTL_HOURS));

  await sendMail({
    to,
    subject: "You’ve been invited to join Flow",
    react: (
      <WorkspaceInviteEmail
        brandLogoUrl={`${env.APP_URL}${ensureAppPath("/api/email-brand")}`}
        workspaceName={workspaceName}
        role={role}
        inviteUrl={inviteUrl}
        expiryDate={expiryDate}
      />
    ),
  });
}

export async function sendTeamAssignmentEmail({
  to,
  fullName,
  teamName,
  workspaceName,
  workspaceUrl,
}: {
  to: string;
  fullName: string;
  teamName: string;
  workspaceName: string;
  workspaceUrl: string;
}) {
  await sendMail({
    to,
    subject: `You’ve been added to the ${teamName} team`,
    react: (
      <TeamAssignmentEmail
        fullName={fullName}
        teamName={teamName}
        workspaceName={workspaceName}
        workspaceUrl={workspaceUrl}
      />
    ),
  });
}

export async function sendTaskAssignmentEmail({
  to,
  fullName,
  taskTitle,
  projectName,
  dueDate,
  taskUrl,
  reassigned = false,
}: {
  to: string;
  fullName: string;
  taskTitle: string;
  projectName: string;
  dueDate: string;
  taskUrl: string;
  reassigned?: boolean;
}) {
  await sendMail({
    to,
    subject: reassigned ? `Task reassigned: ${taskTitle}` : `New task assigned: ${taskTitle}`,
    react: reassigned ? (
      <TaskReassignmentEmail
        fullName={fullName}
        taskTitle={taskTitle}
        projectName={projectName}
        taskUrl={taskUrl}
      />
    ) : (
      <TaskAssignmentEmail
        fullName={fullName}
        taskTitle={taskTitle}
        projectName={projectName}
        dueDate={dueDate}
        taskUrl={taskUrl}
      />
    ),
  });
}

export async function sendWelcomeEmail({
  to,
  fullName,
  workspaceName,
  dashboardUrl,
}: {
  to: string;
  fullName: string;
  workspaceName: string;
  dashboardUrl: string;
}) {
  await sendMail({
    to,
    subject: "Welcome to Flow",
    react: (
      <WelcomeEmail
        fullName={fullName}
        workspaceName={workspaceName}
        dashboardUrl={dashboardUrl}
      />
    ),
  });
}

export async function sendPasswordResetCodeEmail({
  to,
  fullName,
  code,
  expiryMinutes,
}: {
  to: string;
  fullName: string;
  code: string;
  expiryMinutes: number;
}) {
  const env = getEnv();

  await sendMail({
    to,
    subject: "Your Flow password reset code",
    react: (
      <PasswordResetCodeEmail
        code={code}
        expiryMinutes={expiryMinutes}
        fullName={fullName}
        signInUrl={`${env.APP_URL}${ensureAppPath("/auth/signin")}`}
      />
    ),
  });
}
