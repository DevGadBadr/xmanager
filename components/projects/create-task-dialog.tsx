"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { TaskForm } from "@/components/forms/task-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CreateTaskDialog({
  className,
  memberships,
  projectId,
}: {
  className?: string;
  memberships: Array<{ id: string; user: { fullName: string | null; email: string; image: string | null } }>;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className={cn(className)} size="sm" type="button">
          <Plus className="h-3.5 w-3.5" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Add a new task for this project and assign the right owner, status, and due date.</DialogDescription>
        </DialogHeader>
        <TaskForm
          className="border-0 shadow-none"
          memberships={memberships}
          onSuccess={() => setOpen(false)}
          projectId={projectId}
          title="Task details"
        />
      </DialogContent>
    </Dialog>
  );
}
