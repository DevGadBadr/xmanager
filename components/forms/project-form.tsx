"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { initialActionState } from "@/lib/action-state";
import { createProjectAction } from "@/modules/projects/actions";
import { projectSchema } from "@/modules/projects/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProjectValues = z.infer<typeof projectSchema>;

export function ProjectForm({
  className,
  title = "Create project",
  onSuccess,
}: {
  className?: string;
  title?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialActionState);
  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "PLANNING",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset({
        name: "",
        description: "",
        status: "PLANNING",
        dueDate: "",
      });
      onSuccess?.();
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [form, onSuccess, state]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            const payload = new FormData();
            payload.set("name", values.name);
            payload.set("description", values.description ?? "");
            payload.set("status", values.status);
            payload.set("dueDate", values.dueDate ?? "");
            startTransition(() => formAction(payload));
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" rows={4} {...form.register("description")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select id="project-status" {...form.register("status")}>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-due-date">Due date</Label>
              <Input id="project-due-date" type="date" {...form.register("dueDate")} />
            </div>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Creating..." : "Create project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
