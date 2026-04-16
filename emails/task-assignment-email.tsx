import * as React from "react";

import { BaseTemplate } from "@/emails/base-template";

type TaskAssignmentEmailProps = {
  fullName: string;
  taskTitle: string;
  projectName: string;
  dueDate: string;
  taskUrl: string;
};

export function TaskAssignmentEmail(props: TaskAssignmentEmailProps) {
  return (
    <BaseTemplate
      preview="A task has been assigned to you in Flow."
      heading={`New task assigned: ${props.taskTitle}`}
      greeting={`Hello ${props.fullName},`}
      context={`You have been assigned the task "${props.taskTitle}" in project ${props.projectName}. Due date: ${props.dueDate}.`}
      ctaLabel="View Task"
      ctaUrl={props.taskUrl}
      fallbackLabel="View task"
      footer="Please review the task details and update status as work progresses."
    />
  );
}
