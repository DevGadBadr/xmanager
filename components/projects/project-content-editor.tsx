"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Pencil } from "lucide-react";
import { toast } from "sonner";

import { EditIconButton } from "@/components/shared/edit-icon-button";
import { initialActionState } from "@/lib/action-state";
import { updateProjectContentAction } from "@/modules/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FloatingPosition = {
  left: number;
  top: number;
  width: number;
};

export function ProjectContentEditor({
  canEditContent,
  description,
  name,
  projectId,
  trigger = "title",
}: {
  canEditContent: boolean;
  description: string | null;
  name: string;
  projectId: string;
  trigger?: "icon" | "title";
}) {
  const [state, formAction, pending] = useActionState(updateProjectContentAction, initialActionState);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const [draftName, setDraftName] = useState(name);
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
    setIsEditorOpen(false);
    setAnchorElement(null);
    setPosition(null);
  };

  useEffect(() => {
    if (!isEditorOpen || !anchorElement) {
      return;
    }

    const updatePosition = () => {
      setPosition(getFloatingPosition(anchorElement.getBoundingClientRect()));
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
  }, [anchorElement, isEditorOpen]);

  const submitUpdate = (nextName: string, nextDescription: string) => {
    const payload = new FormData();
    payload.set("projectId", projectId);
    payload.set("name", nextName);
    payload.set("description", nextDescription);

    startTransition(() => formAction(payload));
  };

  const submitAndClose = () => {
    closeEditor();
    submitUpdate(draftName, draftDescription);
  };

  const openEditor = (target: HTMLElement) => {
    setDraftName(name);
    setDraftDescription(description ?? "");

    const nextPosition = getFloatingPosition(target.getBoundingClientRect());

    if (isEditorOpen && anchorElement === target) {
      closeEditor();
      return;
    }

    setAnchorElement(target);
    setPosition(nextPosition);
    setIsEditorOpen(true);
  };

  return (
    <>
      <div className="min-w-0">
        {canEditContent ? (
          trigger === "icon" ? (
            <EditIconButton label="Edit project" onClick={(event) => openEditor(event.currentTarget)} />
          ) : (
            <button
              className="inline-flex max-w-full items-center gap-2 rounded-lg text-left text-3xl font-semibold tracking-tight text-zinc-950 transition hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-zinc-50 dark:hover:text-sky-300 sm:text-4xl"
              onClick={(event) => openEditor(event.currentTarget)}
              type="button"
            >
              <>
                <span className="truncate">{name}</span>
                <Pencil className="h-4 w-4 shrink-0 text-zinc-400" />
              </>
            </button>
          )
        ) : (
          <h1 className="truncate text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            {name}
          </h1>
        )}
      </div>

      <FloatingEditorShell panelRef={panelRef} position={position}>
        {isEditorOpen ? (
          <div className="space-y-3 p-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Project name
              </p>
              <Input onChange={(event) => setDraftName(event.target.value)} value={draftName} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Description
                </p>
              </div>
              <Textarea
                onChange={(event) => setDraftDescription(event.target.value)}
                rows={6}
                value={draftDescription}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setDraftName(name);
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

function getFloatingPosition(rect: DOMRect): FloatingPosition {
  const gutter = 16;
  const width = 520;
  const estimatedHeight = 260;
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
