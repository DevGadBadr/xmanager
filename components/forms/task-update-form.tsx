"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { updateTaskAction } from "@/modules/tasks/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function TaskUpdateForm({
  task,
  memberships,
  className,
  title = "Update task",
}: {
  task: {
    id: string;
    status: string;
    priority: string;
    assigneeMembershipId: string | null;
    startDate?: Date | string | null;
    dueDate?: Date | string | null;
  };
  memberships: Array<{ id: string; user: { fullName: string | null; email: string } }>;
  className?: string;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState(updateTaskAction, initialActionState);

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(() => formAction(formData));
          }}
        >
          <input name="taskId" type="hidden" value={task.id} />
          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <Select defaultValue={task.status} id="task-status" name="status">
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="IN_REVIEW">In review</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-priority-update">Priority</Label>
            <Select defaultValue={task.priority} id="task-priority-update" name="priority">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-assignee-update">Assignee</Label>
            <Select
              defaultValue={task.assigneeMembershipId ?? ""}
              id="task-assignee-update"
              name="assigneeMembershipId"
            >
              <option value="">Unassigned</option>
              {memberships.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {membership.user.fullName ?? membership.user.email}
                </option>
                ))}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-start-date-update">Start date</Label>
              <Input
                defaultValue={formatDateInput(task.startDate)}
                id="task-start-date-update"
                name="startDate"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date-update">End date</Label>
              <Input
                defaultValue={formatDateInput(task.dueDate)}
                id="task-due-date-update"
                name="dueDate"
                type="date"
              />
            </div>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}
