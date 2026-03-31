export const APP_BASE_PATH = "/xwrike";
export const AUTH_API_PATH = `${APP_BASE_PATH}/api/auth`;

export function ensureAppPath(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalizedPath === APP_BASE_PATH || normalizedPath.startsWith(`${APP_BASE_PATH}/`)) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? APP_BASE_PATH : `${APP_BASE_PATH}${normalizedPath}`;
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
