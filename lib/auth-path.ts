export type AppEnvironment = "development" | "production";

function normalizeBasePath(value?: string | null) {
  if (!value || value === "/") {
    return "";
  }

  const normalizedValue = value.startsWith("/") ? value : `/${value}`;
  return normalizedValue.replace(/\/+$/, "");
}

function resolveAppEnvironment(): AppEnvironment {
  if (process.env.APP_ENV === "development" || process.env.APP_ENV === "production") {
    return process.env.APP_ENV;
  }

  return process.env.NODE_ENV === "development" ? "development" : "production";
}

export const APP_ENV = resolveAppEnvironment();
export const IS_DEVELOPMENT_APP = APP_ENV === "development";
export const APP_BASE_PATH = normalizeBasePath(
  process.env.NEXT_PUBLIC_APP_BASE_PATH ??
    process.env.APP_BASE_PATH ??
    (IS_DEVELOPMENT_APP ? "/flow" : ""),
);
export const AUTH_API_PATH = ensureAppPath("/api/auth");

export function ensureAppPath(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (!APP_BASE_PATH) {
    return normalizedPath;
  }

  if (normalizedPath === APP_BASE_PATH || normalizedPath.startsWith(`${APP_BASE_PATH}/`)) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? APP_BASE_PATH : `${APP_BASE_PATH}${normalizedPath}`;
}

export function resolveAppUrl(appUrl: string, pathname: string) {
  const url = new URL(appUrl);
  const appPathUrl = new URL(ensureAppPath(pathname), url.origin);

  url.pathname = appPathUrl.pathname;
  url.search = appPathUrl.search;
  url.hash = appPathUrl.hash;

  return url.toString();
}

export function resolveAuthUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    url.pathname = AUTH_API_PATH;
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function resolveRedirectUrl(url: string, baseUrl: string) {
  const origin = new URL(baseUrl).origin;

  if (url.startsWith("/")) {
    return `${origin}${ensureAppPath(url)}`;
  }

  try {
    const target = new URL(url);

    if (target.origin === origin) {
      target.pathname = ensureAppPath(target.pathname);
      return target.toString();
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
}
