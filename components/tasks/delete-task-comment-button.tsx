"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { initialActionState } from "@/lib/action-state";
import { deleteTaskCommentAction } from "@/modules/tasks/actions";

export function DeleteTaskCommentButton({
  commentId,
}: {
  commentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteTaskCommentAction, initialActionState);
  const onSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    setOpen(false);
    router.refresh();
  });
  const onError = useEffectEvent((message: string) => {
    toast.error(message);
  });

  useEffect(() => {
    if (state.status === "success" && state.message) {
      onSuccess(state.message);
    }

    if (state.status === "error" && state.message) {
      onError(state.message);
    }
  }, [state]);

  return (
    <ConfirmationDialog
      confirmLabel="Delete comment"
      description="Delete this comment? This cannot be undone."
      onConfirm={() => {
        const payload = new FormData();
        payload.set("commentId", commentId);
        startTransition(() => formAction(payload));
      }}
      onOpenChange={setOpen}
      open={open}
      pending={pending}
      title="Delete comment"
    >
      <DeleteIconButton className="h-7 w-7" label="Delete comment" pending={pending} type="button" />
    </ConfirmationDialog>
  );
}
