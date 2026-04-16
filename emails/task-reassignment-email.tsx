import * as React from "react";

import { BaseTemplate } from "@/emails/base-template";

type TaskReassignmentEmailProps = {
  fullName: string;
  taskTitle: string;
  projectName: string;
  taskUrl: string;
};

export function TaskReassignmentEmail(props: TaskReassignmentEmailProps) {
  return (
    <BaseTemplate
      preview="Ownership of a task has changed in Flow."
      heading={`Task reassigned: ${props.taskTitle}`}
      greeting={`Hello ${props.fullName},`}
      context={`The task "${props.taskTitle}" in project ${props.projectName} has been reassigned to you.`}
      ctaLabel="Review Task"
      ctaUrl={props.taskUrl}
      fallbackLabel="Open task"
      footer="If this looks incorrect, contact your workspace administrator."
    />
  );
}
