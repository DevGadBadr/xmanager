"use client";

import { useRef, useState, useTransition } from "react";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

import {
  confirmPasswordResetAction,
  requestPasswordResetAction,
} from "@/modules/password-reset/actions";
import { initialActionState } from "@/lib/action-state";
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
import { Label } from "@/components/ui/label";

type PasswordResetFlowProps = {
  defaultEmail?: string;
  fixedEmail?: string;
  dialogTriggerLabel?: string;
  title?: string;
  description?: string;
};

export function PasswordResetFlow({
  defaultEmail = "",
  fixedEmail,
  dialogTriggerLabel,
  title = "Reset password",
  description = "We’ll email a one-time code to your invited workspace email.",
}: PasswordResetFlowProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(fixedEmail ?? defaultEmail);
  const [step, setStep] = useState<"request" | "confirm">("request");
  const requestFormRef = useRef<HTMLFormElement>(null);
  const confirmFormRef = useRef<HTMLFormElement>(null);
  const [requestPending, startRequestTransition] = useTransition();
  const [confirmPending, startConfirmTransition] = useTransition();
  const isBusy = requestPending || confirmPending;

  const content = (
    <div className="space-y-4">
      {!dialogTriggerLabel ? (
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      ) : null}

      {step === "request" ? (
        <form
          ref={requestFormRef}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const nextEmail = fixedEmail ?? String(formData.get("email") ?? "");

            setEmail(nextEmail);
            startRequestTransition(async () => {
              const state = await requestPasswordResetAction(initialActionState, formData);

              if (state.status === "success") {
                if (state.message) {
                  toast.success(state.message);
                }

                setStep("confirm");
                return;
              }

              if (state.status === "error" && state.message) {
                toast.error(state.message);
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={dialogTriggerLabel ? "password-reset-email-dialog" : "password-reset-email-inline"}>
              Invited email
            </Label>
            {fixedEmail ? (
              <>
                <Input disabled value={fixedEmail} />
                <input name="email" type="hidden" value={fixedEmail} />
              </>
            ) : (
              <Input
                autoComplete="email"
                defaultValue={defaultEmail}
                disabled={isBusy}
                id={dialogTriggerLabel ? "password-reset-email-dialog" : "password-reset-email-inline"}
                name="email"
                placeholder="member@example.com"
                type="email"
              />
            )}
          </div>
          <Button className="w-full" disabled={isBusy} type="submit">
            <Mail className="h-4 w-4" />
            {requestPending ? "Sending code..." : "Send reset code"}
          </Button>
        </form>
      ) : (
        <form
          ref={confirmFormRef}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startConfirmTransition(async () => {
              const state = await confirmPasswordResetAction(initialActionState, formData);

              if (state.status === "success") {
                if (state.message) {
                  toast.success(state.message);
                }

                setStep("request");
                confirmFormRef.current?.reset();

                if (!fixedEmail) {
                  requestFormRef.current?.reset();
                  setEmail(defaultEmail);
                }

                if (dialogTriggerLabel) {
                  setOpen(false);
                }

                return;
              }

              if (state.status === "error" && state.message) {
                toast.error(state.message);
              }
            });
          }}
        >
          <input name="email" type="hidden" value={email} />
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200">
            Code sent to <span className="font-medium">{email}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor={dialogTriggerLabel ? "password-reset-code-dialog" : "password-reset-code-inline"}>
              One-time code
            </Label>
            <Input
              autoComplete="one-time-code"
              disabled={isBusy}
              id={dialogTriggerLabel ? "password-reset-code-dialog" : "password-reset-code-inline"}
              inputMode="numeric"
              maxLength={6}
              name="code"
              placeholder="123456"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={dialogTriggerLabel ? "password-reset-password-dialog" : "password-reset-password-inline"}>
              New password
            </Label>
            <Input
              autoComplete="new-password"
              disabled={isBusy}
              id={dialogTriggerLabel ? "password-reset-password-dialog" : "password-reset-password-inline"}
              name="password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={dialogTriggerLabel ? "password-reset-confirm-dialog" : "password-reset-confirm-inline"}>
              Confirm password
            </Label>
            <Input
              autoComplete="new-password"
              disabled={isBusy}
              id={dialogTriggerLabel ? "password-reset-confirm-dialog" : "password-reset-confirm-inline"}
              name="confirmPassword"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" disabled={isBusy} type="submit">
              <KeyRound className="h-4 w-4" />
              {confirmPending ? "Updating password..." : "Update password"}
            </Button>
            <Button
              className="flex-1"
              disabled={isBusy}
              onClick={() => setStep("request")}
              type="button"
              variant="outline"
            >
              Send a new code
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  if (!dialogTriggerLabel) {
    return content;
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setStep("request");
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="w-full" type="button" variant="outline">
          <KeyRound className="h-4 w-4" />
          {dialogTriggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
