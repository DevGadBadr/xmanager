"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";

import { completeOnboardingAction } from "@/modules/invitations/actions";
import { DEPARTMENT_OPTIONS, onboardingSchema } from "@/modules/invitations/schemas";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm({
  defaultEmail,
  token,
  defaultName,
}: {
  defaultEmail: string;
  token: string;
  defaultName?: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    initialActionState,
  );
  const autoLoginStarted = useRef(false);
  const signingIn = state.status === "success";
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      token,
      fullName: defaultName ?? "",
      title: "",
      department: DEPARTMENT_OPTIONS[0],
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (state.status !== "success" || autoLoginStarted.current) {
      return;
    }

    autoLoginStarted.current = true;

    const password = form.getValues("password");

    void signIn("credentials", {
      email: defaultEmail,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    }).then((result) => {
      if (!result || result.error) {
        autoLoginStarted.current = false;
        toast.error("Profile was saved, but automatic sign-in failed. Use your new email password on the sign-in page.");
        router.push("/auth/signin");
        return;
      }

      window.location.assign(result.url ?? "/dashboard");
    });
  }, [defaultEmail, form, router, state.status]);

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => {
        const payload = new FormData();
        payload.set("token", values.token);
        payload.set("fullName", values.fullName);
        payload.set("title", values.title);
        payload.set("department", values.department);
        payload.set("password", values.password);
        payload.set("confirmPassword", values.confirmPassword);
        startTransition(() => formAction(payload));
      })}
    >
      <input type="hidden" value={token} {...form.register("token")} />
      <div className="space-y-2">
        <Label>Email</Label>
        <Input disabled value={defaultEmail} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...form.register("fullName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Project Manager" {...form.register("title")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select id="department" {...form.register("department")}>
          {DEPARTMENT_OPTIONS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="new-password"
          id="password"
          type="password"
          {...form.register("password")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          autoComplete="new-password"
          id="confirmPassword"
          type="password"
          {...form.register("confirmPassword")}
        />
      </div>
      <Button className="w-full" disabled={pending || signingIn} type="submit">
        {pending ? "Completing setup..." : signingIn ? "Signing you in..." : "Create account"}
      </Button>
    </form>
  );
}
