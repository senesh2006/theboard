import { cookies } from "next/headers";
import { Role } from "@prisma/client";

export const DEMO_COOKIE = "theboard_demo_user";

/** Prisma user id for cookie-based demo login (no Supabase auth). */
export const DEMO_STUDENT_ID = "theboard-demo-student";

export function isDemoBypassEnabled(): boolean {
  return process.env.ENABLE_DEMO_BYPASS === "true";
}

export function getDemoUserIdFromCookieValue(value: string | undefined): string | null {
  if (!isDemoBypassEnabled() || !value) return null;
  if (value === DEMO_STUDENT_ID) return value;
  return null;
}

export function getDemoRole(userId: string): Role | null {
  if (userId === DEMO_STUDENT_ID) return Role.STUDENT;
  return null;
}

export async function getDemoUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return getDemoUserIdFromCookieValue(cookieStore.get(DEMO_COOKIE)?.value);
}

export async function setDemoSession(userId: string): Promise<void> {
  if (!isDemoBypassEnabled()) {
    throw new Error("Demo bypass is disabled");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
}
