"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button, type ButtonProps } from "@/components/ui/button";

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
  label = "Continue with Google",
  ...props
}: {
  callbackUrl?: string;
  label?: string;
} & Omit<ButtonProps, "children" | "onClick" | "type">) {
  return (
    <Button
      {...props}
      onClick={() => signIn("google", { callbackUrl })}
      type="button"
    >
      <LogIn className="h-4 w-4" />
      {label}
    </Button>
  );
}
