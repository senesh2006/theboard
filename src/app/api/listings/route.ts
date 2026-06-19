import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildListingWhere } from "@/lib/listings/queries";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  listingBrowseFiltersSchema,
  listingCreateSchema,
} from "@/lib/validations/listing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams.entries());

  const parsed = listingBrowseFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid filters", 400);
  }

  const { page, pageSize, ...filters } = parsed.data;
  const where = buildListingWhere(filters);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        poster: { select: { name: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return jsonOk({
    listings,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function POST(request: Request) {
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

  const parsed = listingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const listing = await prisma.listing.create({
    data: {
      posterId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      district: parsed.data.district,
      isRemote: parsed.data.isRemote,
      isPartTime: parsed.data.isPartTime,
      skillsRequired: parsed.data.skillsRequired,
      deadline: parsed.data.deadline,
    },
  });

  return jsonOk({ listing }, 201);
}
