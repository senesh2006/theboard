import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildListingWhere } from "@/lib/listings/queries";
import { listingBrowseFiltersSchema } from "@/lib/validations/listing";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingCard } from "@/components/listings/listing-card";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

type ListingsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const raw = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const parsed = listingBrowseFiltersSchema.safeParse(raw);
  const filters = parsed.success
    ? parsed.data
    : listingBrowseFiltersSchema.parse({});

  const { page, pageSize, ...filterFields } = filters;
  const where = buildListingWhere(filterFields);

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (filterFields.q) params.set("q", filterFields.q);
    if (filterFields.district) params.set("district", filterFields.district);
    if (filterFields.remote !== undefined) params.set("remote", String(filterFields.remote));
    if (filterFields.partTime !== undefined) params.set("partTime", String(filterFields.partTime));
    params.set("page", String(nextPage));
    return `/listings?${params.toString()}`;
  }

  return (
    <PageShell
      title="Browse opportunities"
      description="Internships and gigs from across the board — filter by what matters to you."
    >
      <Suspense fallback={<div className="mb-6 h-40 animate-pulse rounded-xl bg-slate-100" />}>
        <ListingFilters />
      </Suspense>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-600">No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(page - 1)}>
              <Button variant="secondary" size="sm">
                Previous
              </Button>
            </Link>
          ) : null}
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)}>
              <Button variant="secondary" size="sm">
                Next
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}
