import { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student/dashboard",
  POSTER: "/poster/dashboard",
  ADMIN: "/admin",
};

export const PROTECTED_PREFIXES: Record<Role, string[]> = {
  STUDENT: ["/student"],
  POSTER: ["/poster", "/listings/new"],
  ADMIN: ["/admin"],
};

export function roleCanAccessPath(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/listings/new")) {
    return role === Role.POSTER || role === Role.ADMIN;
  }

  for (const [allowedRole, prefixes] of Object.entries(PROTECTED_PREFIXES)) {
    if (allowedRole === role) continue;
    for (const prefix of prefixes) {
      if (pathname.startsWith(prefix)) return false;
    }
  }

  const ownPrefixes = PROTECTED_PREFIXES[role] ?? [];
  const hitsProtected = Object.values(PROTECTED_PREFIXES)
    .flat()
    .some((prefix) => pathname.startsWith(prefix));

  if (!hitsProtected) return true;

  return ownPrefixes.some((prefix) => pathname.startsWith(prefix));
}
