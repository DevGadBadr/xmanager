import { IS_DEVELOPMENT_APP, resolveAppUrl } from "@/lib/auth-path";

const EMAIL_BRAND_VERSION = "compact-20260419";
const PUBLIC_EMAIL_BRAND_URL = `https://flow.devgadbadr.me/api/email-brand?v=${EMAIL_BRAND_VERSION}`;

export function getEmailBrandUrl(appUrl: string) {
  if (IS_DEVELOPMENT_APP) {
    return PUBLIC_EMAIL_BRAND_URL;
  }

  return resolveAppUrl(appUrl, `/api/email-brand?v=${EMAIL_BRAND_VERSION}`);
}
