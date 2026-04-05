"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { initialActionState } from "@/lib/action-state";
import { deleteProjectAction } from "@/modules/projects/actions";

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo = "/projects",
  className,
}: {
  projectId: string;
  projectName: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteProjectAction, initialActionState);
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
  }, [redirectTo, state]);

  return (
    <ConfirmationDialog
      confirmLabel="Delete project"
      description={`Delete project "${projectName}"? This will remove it from project views and archive its tasks.`}
      onConfirm={() => {
        const payload = new FormData();
        payload.set("projectId", projectId);
        startTransition(() => formAction(payload));
      }}
      onOpenChange={setOpen}
      open={open}
      pending={pending}
      title="Delete project"
    >
      <DeleteIconButton className={className} label={`Delete ${projectName}`} pending={pending} type="button" />
    </ConfirmationDialog>
  );
}
