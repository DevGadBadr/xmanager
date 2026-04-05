"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { updateTaskCommentAction } from "@/modules/tasks/actions";

export function EditTaskCommentButton({
  commentBody,
  commentId,
}: {
  commentBody: string;
  commentId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(commentBody);
  const [state, formAction, pending] = useActionState(updateTaskCommentAction, initialActionState);
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
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setBody(commentBody);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="h-7 gap-1.5 px-2 text-xs" size="sm" type="button" variant="ghost">
          <PencilLine className="h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit comment</DialogTitle>
          <DialogDescription>Update your comment on this task.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const payload = new FormData();
            payload.set("commentId", commentId);
            payload.set("body", body);
            startTransition(() => formAction(payload));
          }}
        >
          <Textarea onChange={(event) => setBody(event.target.value)} rows={6} value={body} />
          <div className="flex justify-end gap-2">
            <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="outline">
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
