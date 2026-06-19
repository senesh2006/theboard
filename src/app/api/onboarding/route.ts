import { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { ROLE_HOME } from "@/lib/auth/roles";
import { profileSchema } from "@/lib/validations/profile";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return jsonError("Unauthorized", 401);
  }

  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existing) {
    return jsonOk({ redirectTo: ROLE_HOME[existing.role] });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  if (parsed.data.role === Role.ADMIN) {
    return jsonError("Invalid role selection", 400);
  }

  const user = await prisma.user.create({
    data: {
      id: authUser.id,
      email: authUser.email,
      name: parsed.data.name,
      district: parsed.data.district,
      skills: parsed.data.skills,
      role: parsed.data.role,
    },
  });

  await supabase.auth.updateUser({
    data: { role: user.role, name: user.name },
  });

  return jsonOk({ redirectTo: ROLE_HOME[user.role] }, 201);
}
