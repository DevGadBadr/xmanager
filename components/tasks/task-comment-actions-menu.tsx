"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useState } from "react";
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { deleteTaskCommentAction, updateTaskCommentAction } from "@/modules/tasks/actions";

export function TaskCommentActionsMenu({
  commentBody,
  commentId,
}: {
  commentBody: string;
  commentId: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [body, setBody] = useState(commentBody);
  const [editState, editFormAction, editPending] = useActionState(updateTaskCommentAction, initialActionState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteTaskCommentAction, initialActionState);
  const onEditSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    setEditOpen(false);
    router.refresh();
  });
  const onDeleteSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    setDeleteOpen(false);
    router.refresh();
  });
  const onError = useEffectEvent((message: string) => {
    toast.error(message);
  });

  useEffect(() => {
    if (editState.status === "success" && editState.message) {
      onEditSuccess(editState.message);
    }

    if (editState.status === "error" && editState.message) {
      onError(editState.message);
    }
  }, [editState]);

  useEffect(() => {
    if (deleteState.status === "success" && deleteState.message) {
      onDeleteSuccess(deleteState.message);
    }

    if (deleteState.status === "error" && deleteState.message) {
      onError(deleteState.message);
    }
  }, [deleteState]);

  return (
    <>
      <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Update actions" className="h-7 w-7" size="icon" type="button" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              setBody(commentBody);
              setEditOpen(true);
            }}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 dark:text-red-300 dark:focus:text-red-300"
            onSelect={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit update</DialogTitle>
            <DialogDescription>Revise the content of this task update.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const payload = new FormData();
              payload.set("commentId", commentId);
              payload.set("body", body);
              startTransition(() => editFormAction(payload));
            }}
          >
            <Textarea
              className="min-h-[7.5rem]"
              onChange={(event) => setBody(event.target.value)}
              placeholder={"Update the text while keeping formatting, spacing, links, and markdown-lite content."}
              rows={6}
              value={body}
            />
            <div className="flex justify-end gap-2">
              <Button disabled={editPending} onClick={() => setEditOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={editPending} type="submit">
                {editPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        confirmLabel="Delete update"
        description="Delete this update? This cannot be undone."
        onConfirm={() => {
          const payload = new FormData();
          payload.set("commentId", commentId);
          startTransition(() => deleteFormAction(payload));
        }}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        pending={deletePending}
        title="Delete update"
      >
        <span className="hidden" />
      </ConfirmationDialog>
    </>
  );
}
