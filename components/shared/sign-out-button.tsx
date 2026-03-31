"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "destructive";
}) {
  return (
    <Button
      className={className}
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
      variant={variant}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
