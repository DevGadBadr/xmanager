"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { initialActionState } from "@/lib/action-state";
import { deleteTeamAction } from "@/modules/teams/actions";

export function DeleteTeamButton({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteTeamAction, initialActionState);
  const onSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    setOpen(false);
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
      confirmLabel="Delete team"
      description={`Delete team "${teamName}"? This removes its member links and cannot be undone.`}
      onConfirm={() => {
        const payload = new FormData();
        payload.set("teamId", teamId);
        startTransition(() => formAction(payload));
      }}
      onOpenChange={setOpen}
      open={open}
      pending={pending}
      title="Delete team"
    >
      <DeleteIconButton label={`Delete ${teamName}`} pending={pending} type="button" />
    </ConfirmationDialog>
  );
}
