"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { updateTeamContentAction } from "@/modules/teams/actions";

export function EditTeamDialog({
  teamId,
  name,
  description,
}: {
  teamId: string;
  name: string;
  description: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const [state, formAction, pending] = useActionState(updateTeamContentAction, initialActionState);
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

  const resetDraft = () => {
    setDraftName(name);
    setDraftDescription(description ?? "");
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          resetDraft();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button aria-label={`Edit ${name}`} size="icon" type="button" variant="outline">
          <PencilLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>Update the team name and description.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();

            const payload = new FormData();
            payload.set("teamId", teamId);
            payload.set("name", draftName);
            payload.set("description", draftDescription);
            startTransition(() => formAction(payload));
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor={`team-name-${teamId}`}>
              Team name
            </label>
            <Input
              id={`team-name-${teamId}`}
              onChange={(event) => setDraftName(event.target.value)}
              value={draftName}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
              htmlFor={`team-description-${teamId}`}
            >
              Description
            </label>
            <Textarea
              id={`team-description-${teamId}`}
              onChange={(event) => setDraftDescription(event.target.value)}
              rows={4}
              value={draftDescription}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              disabled={pending}
              onClick={() => {
                resetDraft();
                setOpen(false);
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
