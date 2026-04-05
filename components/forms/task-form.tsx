"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";
import { createTaskAction } from "@/modules/tasks/actions";
import { taskSchema } from "@/modules/tasks/schemas";
import { TaskAssigneeSummary, getTaskAssigneeLabel, getTaskAssigneeInitials, type TaskAssigneeView } from "@/components/tasks/task-assignee-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TaskValues = z.input<typeof taskSchema>;

export function TaskForm({
  projectId,
  memberships,
  className,
  title = "Create task",
  onSuccess,
}: {
  projectId: string;
  memberships: Array<{ id: string; user: { fullName: string | null; email: string } }>;
  className?: string;
  title?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialActionState);
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId,
      title: "",
      description: "",
      priority: "MEDIUM",
      assigneeMembershipIds: [],
      startDate: "",
      dueDate: "",
    },
  });
  const watchedAssigneeIds = useWatch({
    control: form.control,
    name: "assigneeMembershipIds",
    defaultValue: [],
  });
  const selectedAssigneeIds = useMemo(() => watchedAssigneeIds ?? [], [watchedAssigneeIds]);
  const selectedAssignees = useMemo<TaskAssigneeView[]>(
    () =>
      memberships
        .filter((membership) => selectedAssigneeIds.includes(membership.id))
        .map((membership) => ({
          membershipId: membership.id,
          user: membership.user,
        })),
    [memberships, selectedAssigneeIds],
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset({
        projectId,
        title: "",
        description: "",
        priority: "MEDIUM",
        assigneeMembershipIds: [],
        startDate: "",
        dueDate: "",
      });
      onSuccess?.();
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [form, onSuccess, projectId, state]);

  const toggleAssignee = (membershipId: string) => {
    const nextValue = selectedAssigneeIds.includes(membershipId)
      ? selectedAssigneeIds.filter((value) => value !== membershipId)
      : [...selectedAssigneeIds, membershipId];

    form.setValue("assigneeMembershipIds", nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className={cn("space-y-3.5")}
          onSubmit={form.handleSubmit((values) => {
            const payload = new FormData();
            payload.set("projectId", values.projectId);
            payload.set("title", values.title);
            payload.set("description", values.description ?? "");
            payload.set("priority", values.priority);
            for (const membershipId of values.assigneeMembershipIds ?? []) {
              payload.append("assigneeMembershipIds", membershipId);
            }
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
          <div className="grid gap-3.5 md:grid-cols-2">
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
              <Label>Assignees</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-950 shadow-xs outline-none transition hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    type="button"
                  >
                    <TaskAssigneeSummary assignees={selectedAssignees} />
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 p-1.5">
                  <button
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    onClick={() =>
                      form.setValue("assigneeMembershipIds", [], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    type="button"
                  >
                    <span>Clear all</span>
                    {selectedAssigneeIds.length === 0 ? <Check className="h-4 w-4" /> : null}
                  </button>
                  <div className="mt-1 max-h-72 space-y-1 overflow-y-auto">
                    {memberships.map((membership) => {
                      const selected = selectedAssigneeIds.includes(membership.id);
                      return (
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            selected && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
                          )}
                          key={membership.id}
                          onClick={() => toggleAssignee(membership.id)}
                          type="button"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getTaskAssigneeInitials(getTaskAssigneeLabel({ membershipId: membership.id, user: membership.user }))}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {membership.user.fullName ?? membership.user.email}
                          </span>
                          {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2">
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
