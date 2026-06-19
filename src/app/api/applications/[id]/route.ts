import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { applicationStatusUpdateSchema } from "@/lib/validations/application";

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== Role.POSTER && user.role !== Role.ADMIN) {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = applicationStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { posterId: true } },
    },
  });

  if (!application) {
    return jsonError("Application not found", 404);
  }

  if (user.role !== Role.ADMIN && application.listing.posterId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return jsonOk({ application: updated });
}
