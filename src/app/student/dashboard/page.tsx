import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";

export default async function StudentDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.STUDENT) redirect("/");

  const applications = await prisma.application.findMany({
    where: { studentId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          district: true,
          isRemote: true,
          isPartTime: true,
          status: true,
        },
      },
    },
  });

  return (
    <PageShell
      title={`Hi, ${user.name.split(" ")[0]}`}
      description="Track your applications and browse new opportunities."
      actions={
        <Link href="/listings">
          <Button>Browse listings</Button>
        </Link>
      }
    >
      <Card className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Your profile</h2>
            <p className="mt-1 text-sm text-slate-600">
              District: {user.district ?? "Not set"} · Skills:{" "}
              {user.skills.length > 0 ? user.skills.join(", ") : "None yet"}
            </p>
          </div>
          <Link href="/student/profile">
            <Button variant="secondary" size="sm">
              Edit profile
            </Button>
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">My applications</h2>
        {applications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            You haven&apos;t applied to anything yet.{" "}
            <Link href="/listings" className="text-indigo-600 hover:underline">
              Browse listings
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {applications.map((application) => (
              <li
                key={application.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/listings/${application.listing.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {application.listing.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    Applied {new Date(application.createdAt).toLocaleDateString()}
                    {application.listing.district
                      ? ` · ${application.listing.district}`
                      : ""}
                    {application.listing.isRemote ? " · Remote" : ""}
                    {application.listing.isPartTime ? " · Part-time" : ""}
                  </p>
                  {application.listing.status !== "ACTIVE" ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Listing is {application.listing.status.toLowerCase()}
                    </p>
                  ) : null}
                </div>
                <ApplicationStatusBadge status={application.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
