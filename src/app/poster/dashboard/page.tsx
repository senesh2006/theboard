import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/db/errors";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PosterDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.POSTER) redirect("/");

  const listingsResult = await withDatabase(() =>
    prisma.listing.findMany({
      where: { posterId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } },
      },
    }),
  );

  if ("error" in listingsResult) {
    return (
      <PageShell title="Poster dashboard">
        <Card>
          <p className="text-sm text-red-600">{listingsResult.error}</p>
        </Card>
      </PageShell>
    );
  }

  const listings = listingsResult.data;

  return (
    <PageShell
      title="Poster dashboard"
      description="Manage listings and review applicants."
      actions={
        <Link href="/listings/new">
          <Button>Post a role</Button>
        </Link>
      }
    >
      <Card>
        <h2 className="font-semibold text-slate-900">Your listings</h2>
        {listings.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            You haven&apos;t posted anything yet.{" "}
            <Link href="/listings/new" className="text-indigo-600 hover:underline">
              Create your first listing
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {listing.viewCount} views · {listing._count.applications} applicant
                    {listing._count.applications === 1 ? "" : "s"} ·{" "}
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={listing.status === "ACTIVE" ? "success" : "muted"}>
                    {listing.status}
                  </Badge>
                  {listing._count.applications > 0 ? (
                    <Link href={`/poster/listings/${listing.id}/applicants`}>
                      <Button size="sm" variant="secondary">
                        View applicants
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">No applicants yet</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
