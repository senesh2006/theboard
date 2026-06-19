import { Role, Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { applicationCreateSchema } from "@/lib/validations/application";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== Role.STUDENT) {
    return jsonError("Only students can apply to listings", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = applicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, status: true, posterId: true },
  });

  if (!listing || listing.status !== "ACTIVE") {
    return jsonError("Listing is not available for applications", 404);
  }

  if (listing.posterId === user.id) {
    return jsonError("You cannot apply to your own listing", 400);
  }

  const existing = await prisma.application.findUnique({
    where: {
      listingId_studentId: {
        listingId: parsed.data.listingId,
        studentId: user.id,
      },
    },
  });

  if (existing) {
    return jsonError("You have already applied to this listing", 409);
  }

  try {
    const application = await prisma.application.create({
      data: {
        listingId: parsed.data.listingId,
        studentId: user.id,
      },
    });

    return jsonOk({ application }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("You have already applied to this listing", 409);
    }
    throw error;
  }
}
