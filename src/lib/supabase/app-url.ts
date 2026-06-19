import { headers } from "next/headers";

/** Canonical app origin for Supabase email links and OAuth redirects. */
export function getAppOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envUrl) return envUrl;

  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(next = "/onboarding"): string {
  return `${getAppOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}
