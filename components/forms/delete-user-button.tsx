"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { DeleteIconButton } from "@/components/shared/delete-icon-button";
import { initialActionState } from "@/lib/action-state";
import { deleteWorkspaceMemberAction } from "@/modules/memberships/actions";

export function DeleteUserButton({
  membershipId,
  userLabel,
}: {
  membershipId: string;
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteWorkspaceMemberAction, initialActionState);
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
      confirmLabel="Delete user"
      description={`Delete "${userLabel}" from this workspace? Their access will be removed and they will disappear from the Users page.`}
      onConfirm={() => {
        const payload = new FormData();
        payload.set("membershipId", membershipId);
        startTransition(() => formAction(payload));
      }}
      onOpenChange={setOpen}
      open={open}
      pending={pending}
      title="Delete user"
    >
      <DeleteIconButton label={`Delete ${userLabel}`} pending={pending} type="button" />
    </ConfirmationDialog>
  );
}
