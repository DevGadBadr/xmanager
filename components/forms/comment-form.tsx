"use client";

import { startTransition, useActionState, useEffect, useEffectEvent, useRef, useState } from "react";
import { LoaderCircle, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { addTaskCommentAction } from "@/modules/tasks/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(addTaskCommentAction, initialActionState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const onSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    formRef.current?.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFiles([]);
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
    <form
      ref={formRef}
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = new FormData(form);
        startTransition(() => formAction(payload));
      }}
    >
      <input name="taskId" type="hidden" value={taskId} />
      <Textarea name="body" placeholder="Add context, a status update, or a blocker." rows={4} />
      <input
        className="hidden"
        multiple
        name="attachments"
        onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
        ref={fileInputRef}
        type="file"
      />

      {selectedFiles.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          {selectedFiles.map((file) => {
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

            return (
              <div className="rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900" key={fileKey}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">{file.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {pending ? "Uploading..." : "Ready to upload"} • {formatFileSize(file.size)}
                    </p>
                  </div>
                  {!pending ? (
                    <Button
                      aria-label={`Remove ${file.name}`}
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeSelectedFile(fileKey, fileInputRef, setSelectedFiles)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-sky-600 dark:text-sky-300" />
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={pending ? "comment-upload-progress h-full rounded-full bg-sky-500" : "h-full w-full rounded-full bg-emerald-500"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          aria-label="Attach files"
          disabled={pending}
          onClick={() => fileInputRef.current?.click()}
          size="icon"
          type="button"
          variant="outline"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button disabled={pending} type="submit">
          {pending ? "Posting..." : "Add comment"}
        </Button>
      </div>
    </form>
  );
}

function removeSelectedFile(
  fileKey: string,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>,
) {
  const nextFiles = (fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []).filter(
    (file) => `${file.name}-${file.size}-${file.lastModified}` !== fileKey,
  );

  if (fileInputRef.current) {
    const dataTransfer = new DataTransfer();

    nextFiles.forEach((file) => dataTransfer.items.add(file));
    fileInputRef.current.files = dataTransfer.files;
  }

  setSelectedFiles(nextFiles);
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}
