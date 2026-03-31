import type { NextRequest } from "next/server";
import type { AuthAction } from "../../../../node_modules/next-auth/core/types";
import { AuthHandler } from "../../../../node_modules/next-auth/core/index.js";
import { getBody, toResponse } from "../../../../node_modules/next-auth/next/utils.js";

import { authOptions } from "@/lib/auth";
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
  const nextauth = (await context.params).nextauth;
  const query = Object.fromEntries(request.nextUrl.searchParams);
  const body = await getBody(request);
  const internalResponse = await AuthHandler({
    options: authOptions,
    req: {
      body,
      query,
      cookies: Object.fromEntries(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])),
      headers: Object.fromEntries(request.headers),
      method: request.method,
      action: nextauth?.[0] as AuthAction,
      providerId: nextauth?.[1],
      error: query.error ?? nextauth?.[1],
      origin: getCanonicalAuthUrl(request),
    },
  });
  const response = toResponse(internalResponse);
  const redirect = response.headers.get("Location");

  if (body?.json === "true" && redirect) {
    response.headers.delete("Location");
    response.headers.set("Content-Type", "application/json");

    return new Response(JSON.stringify({ url: redirect }), {
      status: internalResponse.status,
      headers: response.headers,
    });
  }

  return response;
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
