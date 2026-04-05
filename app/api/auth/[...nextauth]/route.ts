import type { NextRequest } from "next/server";
import NextAuth from "next-auth/next";
import { getToken } from "next-auth/jwt";

import { createAuthOptions } from "@/lib/auth";
import { resolveAuthUrl } from "@/lib/auth-path";

function getCanonicalAuthUrl(request: NextRequest) {
  const requestAuthUrl = resolveAuthUrl(request.nextUrl.origin);
  const authUrl =
    resolveAuthUrl(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.APP_URL) ??
    requestAuthUrl;

  if (authUrl) {
    process.env.AUTH_URL = authUrl;
    process.env.NEXTAUTH_URL = authUrl;
    process.env.NEXTAUTH_URL_INTERNAL = authUrl;
  }

  return authUrl ?? request.nextUrl.origin;
}

async function handleAuth(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  getCanonicalAuthUrl(request);
  const token = await getToken({ req: request });
  const currentUserId =
    typeof token?.id === "string" ? token.id : typeof token?.sub === "string" ? token.sub : null;
  return NextAuth(request, context, createAuthOptions({ currentUserId }));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return handleAuth(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return handleAuth(request, context);
}
