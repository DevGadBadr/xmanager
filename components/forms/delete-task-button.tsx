"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { initialActionState } from "@/lib/action-state";
import { deleteTaskAction } from "@/modules/tasks/actions";

export function DeleteTaskButton({
  taskId,
  taskTitle,
  redirectTo,
  className,
}: {
  taskId: string;
  taskTitle: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteTaskAction, initialActionState);
  const onSuccess = useEffectEvent((message: string, nextPath?: string) => {
    toast.success(message);
    setOpen(false);

    if (nextPath) {
      router.replace(nextPath);
      router.refresh();
      return;
    }

    router.refresh();
  });
  const onError = useEffectEvent((message: string) => {
    toast.error(message);
  });

  useEffect(() => {
    if (state.status === "success" && state.message) {
      onSuccess(state.message, redirectTo ?? state.redirectTo);
    }

    if (state.status === "error" && state.message) {
      onError(state.message);
    }
  }, [onError, onSuccess, redirectTo, state]);

  return (
    <ConfirmationDialog
      confirmLabel="Delete task"
      description={`Delete task "${taskTitle}"? It will be removed from task and project views.`}
      onConfirm={() => {
        const payload = new FormData();
        payload.set("taskId", taskId);
        startTransition(() => formAction(payload));
      }}
      onOpenChange={setOpen}
      open={open}
      pending={pending}
      title="Delete task"
    >
      <DeleteIconButton className={className} label={`Delete ${taskTitle}`} pending={pending} type="button" />
    </ConfirmationDialog>
  );
}
