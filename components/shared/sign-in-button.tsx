"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignInButton({
  callbackUrl = "/dashboard",
  label = "Sign in",
}: {
  callbackUrl?: string;
  label?: string;
}) {
  const href =
    callbackUrl === "/dashboard"
      ? "/auth/signin"
      : `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Button asChild size="lg" type="button">
      <Link href={href}>
      <LogIn className="h-4 w-4" />
      {label}
      </Link>
    </Button>
  );
}
