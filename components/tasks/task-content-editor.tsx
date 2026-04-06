"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { updateTaskContentAction } from "@/modules/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ActiveEditor = "description" | "title" | null;

type FloatingPosition = {
  left: number;
  top: number;
  width: number;
};

export function TaskContentEditor({
  canEditContent,
  description,
  title,
  taskId,
}: {
  canEditContent: boolean;
  description: string | null;
  title: string;
  taskId: string;
}) {
  const [state, formAction, pending] = useActionState(updateTaskContentAction, initialActionState);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const closeEditor = () => {
    setActiveEditor(null);
    setAnchorElement(null);
    setPosition(null);
  };

  useEffect(() => {
    if (!activeEditor || !anchorElement) {
      return;
    }

    const updatePosition = () => {
      setPosition(getFloatingPosition(anchorElement.getBoundingClientRect(), activeEditor));
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target) || anchorElement.contains(target)) {
        return;
      }

      closeEditor();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEditor();
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeEditor, anchorElement]);

  const submitUpdate = (nextTitle: string, nextDescription: string) => {
    const payload = new FormData();
    payload.set("taskId", taskId);
    payload.set("title", nextTitle);
    payload.set("description", nextDescription);

    startTransition(() => formAction(payload));
  };

  const submitAndClose = () => {
    closeEditor();
    submitUpdate(draftTitle, draftDescription);
  };

  const openEditor = (editor: Exclude<ActiveEditor, null>, target: HTMLElement) => {
    setDraftTitle(title);
    setDraftDescription(description ?? "");

    const nextPosition = getFloatingPosition(target.getBoundingClientRect(), editor);

    if (activeEditor === editor && anchorElement === target) {
      closeEditor();
      return;
    }

    setAnchorElement(target);
    setPosition(nextPosition);
    setActiveEditor(editor);
  };

  return (
    <>
      <div className="space-y-2">
        {canEditContent ? (
          <button
            className="block max-w-full rounded-xl text-left transition hover:text-sky-700 dark:hover:text-sky-300"
            onClick={(event) => openEditor("title", event.currentTarget)}
            type="button"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h2>
          </button>
        ) : (
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h2>
        )}
      </div>

      {canEditContent ? (
        <button
          className="block w-full rounded-xl text-left transition hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60"
          onClick={(event) => openEditor("description", event.currentTarget)}
          type="button"
        >
          <span className="sr-only">Edit description</span>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {description || "No description has been added yet."}
          </p>
        </button>
      ) : (
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          {description || "No description has been added yet."}
        </p>
      )}

      <FloatingEditorShell panelRef={panelRef} position={position}>
        {activeEditor === "title" ? (
          <div className="space-y-3 p-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Task name
              </p>
              <Input onChange={(event) => setDraftTitle(event.target.value)} value={draftTitle} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setDraftTitle(title);
                  closeEditor();
                }}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={pending} onClick={submitAndClose} type="button">
                {pending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : null}

        {activeEditor === "description" ? (
          <div className="space-y-3 p-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Description
                </p>
              </div>
              <Textarea
                onChange={(event) => setDraftDescription(event.target.value)}
                rows={7}
                value={draftDescription}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setDraftDescription(description ?? "");
                  closeEditor();
                }}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button disabled={pending} onClick={submitAndClose} type="button">
                {pending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : null}
      </FloatingEditorShell>
    </>
  );
}

function FloatingEditorShell({
  children,
  panelRef,
  position,
}: {
  children: React.ReactNode;
  panelRef: React.RefObject<HTMLDivElement | null>;
  position: FloatingPosition | null;
}) {
  if (!position || typeof document === "undefined" || !children) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function getFloatingPosition(rect: DOMRect, editor: Exclude<ActiveEditor, null>): FloatingPosition {
  const gutter = 16;
  const width = editor === "description" ? Math.min(560, Math.max(320, Math.round(rect.width))) : 380;
  const estimatedHeight = editor === "description" ? 280 : 160;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = Math.min(Math.max(gutter, rect.left), viewportWidth - width - gutter);
  const fitsBelow = rect.bottom + 8 + estimatedHeight <= viewportHeight - gutter;
  const top = fitsBelow ? rect.bottom + 8 : Math.max(gutter, rect.top - estimatedHeight - 8);

  return {
    left,
    top,
    width,
  };
}
