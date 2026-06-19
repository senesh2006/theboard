import { Role, User } from "@prisma/client";
import { tryCreateClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/db/errors";
import { getDemoUserIdFromCookies } from "@/lib/auth/demo-session";

export type SessionUser = Pick<User, "id" | "role" | "name" | "email" | "district" | "skills">;

async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const result = await withDatabase(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        district: true,
        skills: true,
      },
    }),
  );

  if ("error" in result) return null;
  return result.data;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const demoUserId = await getDemoUserIdFromCookies();
  if (demoUserId) {
    return loadSessionUser(demoUserId);
  }

  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return loadSessionUser(authUser.id);
}

export async function getAuthUser() {
  const demoUserId = await getDemoUserIdFromCookies();
  if (demoUserId) {
    const user = await loadSessionUser(demoUserId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      user_metadata: { role: user.role, name: user.name },
    };
  }

  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireSessionUser(allowedRoles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
