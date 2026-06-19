import { Prisma } from "@prisma/client";
import type { ListingQueryFilters } from "@/lib/validations/listing";

export function buildListingWhere(
  filters: ListingQueryFilters,
): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
  };

  if (filters.district) {
    where.district = { contains: filters.district, mode: "insensitive" };
  }

  if (filters.remote !== undefined) {
    where.isRemote = filters.remote;
  }

  if (filters.partTime !== undefined) {
    where.isPartTime = filters.partTime;
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}
