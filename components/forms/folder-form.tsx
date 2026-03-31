"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { initialActionState } from "@/lib/action-state";
import { createFolderAction } from "@/modules/folders/actions";
import { folderSchema } from "@/modules/folders/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type FolderValues = z.infer<typeof folderSchema>;

export function FolderForm({
  folderOptions = [],
  defaultParentFolderId = "",
  title = "Create folder",
  className,
}: {
  folderOptions?: Array<{ id: string; name: string; depth?: number }>;
  defaultParentFolderId?: string;
  title?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(createFolderAction, initialActionState);
  const form = useForm<FolderValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      scope: "PROJECT",
      parentFolderId: defaultParentFolderId,
    },
  });

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      form.reset({
        name: "",
        scope: "PROJECT",
        parentFolderId: defaultParentFolderId,
      });
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [defaultParentFolderId, form, state]);

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
            payload.set("scope", values.scope);
            payload.set("parentFolderId", values.parentFolderId ?? "");
            startTransition(() => formAction(payload));
          })}
        >
          <input type="hidden" value="PROJECT" {...form.register("scope")} />
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input id="folder-name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-folder">Parent folder</Label>
            <Select id="parent-folder" {...form.register("parentFolderId")}>
              <option value="">Top level</option>
              {folderOptions.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {`${"  ".repeat(folder.depth ?? 0)}${folder.name}`}
                </option>
              ))}
            </Select>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Creating..." : "Create folder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
