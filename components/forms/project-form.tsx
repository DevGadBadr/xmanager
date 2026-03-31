"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";
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
  folderOptions = [],
  defaultFolderId = "",
  className,
  title = "Create project",
}: {
  folderOptions?: Array<{ id: string; name: string; depth?: number }>;
  defaultFolderId?: string;
  className?: string;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialActionState);
  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      folderId: defaultFolderId,
      name: "",
      key: "",
      description: "",
      status: "PLANNING",
      dueDate: "",
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset({
        folderId: defaultFolderId,
        name: "",
        key: "",
        description: "",
        status: "PLANNING",
        dueDate: "",
      });
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [defaultFolderId, form, state]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className={cn("space-y-4", folderOptions.length > 0 ? "space-y-4" : "space-y-4")}
          onSubmit={form.handleSubmit((values) => {
            const payload = new FormData();
            payload.set("folderId", values.folderId ?? "");
            payload.set("name", values.name);
            payload.set("key", values.key);
            payload.set("description", values.description ?? "");
            payload.set("status", values.status);
            payload.set("dueDate", values.dueDate ?? "");
            startTransition(() => formAction(payload));
          })}
        >
          {folderOptions.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="project-folder">Folder</Label>
              <Select id="project-folder" {...form.register("folderId")}>
                <option value="">No folder</option>
                {folderOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {`${"  ".repeat(folder.depth ?? 0)}${folder.name}`}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-key">Key</Label>
              <Input id="project-key" placeholder="OPS" {...form.register("key")} />
            </div>
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
