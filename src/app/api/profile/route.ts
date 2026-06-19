import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/validations/profile";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      district: true,
      skills: true,
      role: true,
      createdAt: true,
    },
  });

  if (!profile) return jsonError("Profile not found", 404);
  return jsonOk({ profile });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      district: parsed.data.district,
      skills: parsed.data.skills,
    },
    select: {
      id: true,
      name: true,
      email: true,
      district: true,
      skills: true,
      role: true,
    },
  });

  return jsonOk({ profile: updated });
}
