import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/db/errors";
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

  const listingsResult = await withDatabase(async () => {
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
    return { listings, total };
  });

  if ("error" in listingsResult) {
    return (
      <PageShell
        title="Browse opportunities"
        description="Internships and gigs from across the board — filter by what matters to you."
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {listingsResult.error}
        </div>
      </PageShell>
    );
  }

  const { listings, total } = listingsResult.data;

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
            <Button href={pageHref(page - 1)} variant="secondary" size="sm">
              Previous
            </Button>
          ) : null}
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button href={pageHref(page + 1)} variant="secondary" size="sm">
              Next
            </Button>
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}
