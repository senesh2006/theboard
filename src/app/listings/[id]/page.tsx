import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/db/errors";
import { getSessionUser } from "@/lib/auth/session";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplyButton } from "@/components/applications/apply-button";

type ListingDetailPageProps = {
  params: { id: string };
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const user = await getSessionUser();

  const listingResult = await withDatabase(async () => {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        poster: { select: { name: true, district: true } },
      },
    });

    if (!listing || listing.status === "FLAGGED") {
      return { notFound: true as const };
    }

    let existingApplication = null;
    if (user?.role === Role.STUDENT) {
      existingApplication = await prisma.application.findUnique({
        where: {
          listingId_studentId: {
            listingId: listing.id,
            studentId: user.id,
          },
        },
        select: { status: true },
      });
    }

    await prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    });

    return { listing, existingApplication };
  });

  if ("error" in listingResult) {
    return (
      <PageShell title="Listing">
        <Card>
          <p className="text-sm text-red-600">{listingResult.error}</p>
        </Card>
      </PageShell>
    );
  }

  if ("notFound" in listingResult.data) {
    notFound();
  }

  const { listing, existingApplication } = listingResult.data;

  const isStudent = user?.role === Role.STUDENT;
  const isOwner = user?.id === listing.posterId;

  return (
    <PageShell
      title={listing.title}
      actions={
        <Button href="/listings" variant="secondary">
          Back to browse
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex flex-wrap gap-2">
              {listing.isRemote ? <Badge>Remote</Badge> : null}
              {listing.isPartTime ? <Badge variant="success">Part-time</Badge> : null}
              {listing.district ? <Badge variant="muted">{listing.district}</Badge> : null}
              {listing.status !== "ACTIVE" ? (
                <Badge variant="muted">{listing.status}</Badge>
              ) : null}
            </div>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm text-slate-700">
              {listing.description}
            </div>
            {listing.skillsRequired.length > 0 ? (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-900">Skills required</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {listing.skillsRequired.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Posted by</h2>
            <p className="mt-1 text-sm text-slate-700">{listing.poster.name}</p>
            {listing.poster.district ? (
              <p className="text-xs text-slate-500">{listing.poster.district}</p>
            ) : null}
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Posted</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {listing.deadline ? (
                <div>
                  <dt className="text-slate-500">Deadline</dt>
                  <dd className="font-medium text-slate-900">
                    {new Date(listing.deadline).toLocaleDateString()}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Views</dt>
                <dd className="font-medium text-slate-900">{listing.viewCount + 1}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Apply</h2>
            {isStudent ? (
              <div className="mt-3">
                <ApplyButton
                  listingId={listing.id}
                  listingStatus={listing.status}
                  existingStatus={existingApplication?.status ?? null}
                />
              </div>
            ) : isOwner ? (
              <p className="mt-2 text-sm text-slate-500">
                This is your listing.{" "}
                <Link
                  href={`/poster/listings/${listing.id}/applicants`}
                  className="text-indigo-600 hover:underline"
                >
                  View applicants
                </Link>
              </p>
            ) : user ? (
              <p className="mt-2 text-sm text-slate-500">
                Only student accounts can apply to listings.
              </p>
            ) : (
              <div className="mt-3">
                <Button href={`/login?next=/listings/${listing.id}`} className="w-full">
                  Log in to apply
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
