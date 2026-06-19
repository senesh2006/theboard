import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Role, User } from "@prisma/client";

export type SessionUser = Pick<User, "id" | "role" | "name" | "email" | "district" | "skills">;

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        district: true,
        skills: true,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("Database unavailable while loading session user:", error);
    return null;
  }
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
