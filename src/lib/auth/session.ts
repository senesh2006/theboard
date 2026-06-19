import { Role, User } from "@prisma/client";
import { tryCreateClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/db/errors";

export type SessionUser = Pick<User, "id" | "role" | "name" | "email" | "district" | "skills">;

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const result = await withDatabase(() =>
    prisma.user.findUnique({
      where: { id: authUser.id },
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

export async function getAuthUser() {
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
