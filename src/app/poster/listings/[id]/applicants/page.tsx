import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApplicationStatusSelect } from "@/components/applications/application-status-select";

type ApplicantsPageProps = {
  params: { id: string };
};

export default async function ListingApplicantsPage({ params }: ApplicantsPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.POSTER && user.role !== Role.ADMIN) redirect("/");

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              district: true,
              skills: true,
            },
          },
        },
      },
    },
  });

  if (!listing) notFound();
  if (user.role !== Role.ADMIN && listing.posterId !== user.id) {
    redirect("/poster/dashboard");
  }

  return (
    <PageShell
      title="Applicants"
      description={listing.title}
      actions={
        <Link href="/poster/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      }
    >
      <Card>
        {listing.applications.length === 0 ? (
          <p className="text-sm text-slate-600">No applications yet for this listing.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {listing.applications.map((application) => (
              <li key={application.id} className="py-4">
                <ApplicationStatusSelect
                  applicationId={application.id}
                  currentStatus={application.status}
                  studentName={application.student.name}
                />
                <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  <p>{application.student.email}</p>
                  <p>
                    {application.student.district
                      ? application.student.district
                      : "District not set"}
                  </p>
                  {application.student.skills.length > 0 ? (
                    <p className="sm:col-span-2">
                      Skills: {application.student.skills.join(", ")}
                    </p>
                  ) : null}
                  <p className="sm:col-span-2 text-slate-400">
                    Applied {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
