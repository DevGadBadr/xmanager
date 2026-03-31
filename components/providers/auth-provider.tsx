"use client";

import { SessionProvider } from "next-auth/react";

import { AUTH_API_PATH } from "@/lib/auth-path";

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionProvider basePath={AUTH_API_PATH}>{children}</SessionProvider>;
}
