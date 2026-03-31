"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";
import { createTaskAction } from "@/modules/tasks/actions";
import { taskSchema } from "@/modules/tasks/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TaskValues = z.infer<typeof taskSchema>;

export function TaskForm({
  projectId,
  memberships,
  className,
  title = "Create task",
}: {
  projectId: string;
  memberships: Array<{ id: string; user: { fullName: string | null; email: string } }>;
  className?: string;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialActionState);
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId,
      title: "",
      description: "",
      priority: "MEDIUM",
      assigneeMembershipId: "",
      startDate: "",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset({
        projectId,
        title: "",
        description: "",
        priority: "MEDIUM",
        assigneeMembershipId: "",
        startDate: "",
        dueDate: "",
      });
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [form, projectId, state]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className={cn("space-y-4")}
          onSubmit={form.handleSubmit((values) => {
            const payload = new FormData();
            payload.set("projectId", values.projectId);
            payload.set("title", values.title);
            payload.set("description", values.description ?? "");
            payload.set("priority", values.priority);
            payload.set("assigneeMembershipId", values.assigneeMembershipId ?? "");
            payload.set("startDate", values.startDate ?? "");
            payload.set("dueDate", values.dueDate ?? "");
            startTransition(() => formAction(payload));
          })}
        >
          <input type="hidden" value={projectId} {...form.register("projectId")} />
          <div className="space-y-2">
            <Label htmlFor="task-title">Task title</Label>
            <Input id="task-title" {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea id="task-description" rows={4} {...form.register("description")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select id="task-priority" {...form.register("priority")}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select id="task-assignee" {...form.register("assigneeMembershipId")}>
                <option value="">Unassigned</option>
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.id}>
                    {membership.user.fullName ?? membership.user.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-start-date">Start date</Label>
              <Input id="task-start-date" type="date" {...form.register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">End date</Label>
              <Input id="task-due-date" type="date" {...form.register("dueDate")} />
            </div>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Creating..." : "Create task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
