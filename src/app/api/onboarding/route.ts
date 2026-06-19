import { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { ROLE_HOME } from "@/lib/auth/roles";
import { profileSchema } from "@/lib/validations/profile";

function databaseErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database is not configured. Set DATABASE_URL on Vercel and redeploy.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return "Database tables are missing. Run prisma migrate deploy on your database.";
    }
  }

  console.error("Onboarding failed:", error);
  return "Could not save your profile. Check DATABASE_URL and try again.";
}

export async function POST(request: Request) {
  try {
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

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { role: user.role, name: user.name },
    });

    if (metadataError) {
      console.error("Failed to sync auth metadata:", metadataError);
    }

    return jsonOk({ redirectTo: ROLE_HOME[user.role] }, 201);
  } catch (error) {
    return jsonError(databaseErrorMessage(error), 500);
  }
}
