"use client";

import { startTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { addTaskCommentAction } from "@/modules/tasks/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(addTaskCommentAction, initialActionState);

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = new FormData(form);
        startTransition(() => formAction(payload));
        form.reset();
      }}
    >
      <input name="taskId" type="hidden" value={taskId} />
      <Textarea name="body" placeholder="Add context, a status update, or a blocker." rows={4} />
      <Button disabled={pending} type="submit">
        {pending ? "Posting..." : "Add comment"}
      </Button>
    </form>
  );
}
