"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { initialActionState } from "@/lib/action-state";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { revokeInvitationAction } from "@/modules/invitations/actions";

export function RevokeInviteButton({ invitationId }: { invitationId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(revokeInvitationAction, initialActionState);
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
      confirmLabel="Remove invite"
      description="Remove this pending invitation? The invite link will stop working immediately."
      onConfirm={() => {
        const payload = new FormData();
        payload.set("invitationId", invitationId);
        startTransition(() => formAction(payload));
      }}
      onOpenChange={setOpen}
      open={open}
      pending={pending}
      title="Remove invitation"
    >
      <DeleteIconButton label="Remove invite" pending={pending} type="button" />
    </ConfirmationDialog>
  );
}
