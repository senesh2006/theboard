import { redirect } from "next/navigation";
import { Role, ListingStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/layout/page-shell";
import { JobFinderAgent } from "@/components/agent/job-finder-agent";

export default async function StudentAgentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/student/agent");
  if (user.role !== Role.STUDENT) redirect("/");

  const listings = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      title: true,
      district: true,
      isRemote: true,
      isPartTime: true,
    },
  });

  return (
    <PageShell
      title="Job Finder Agent"
      description="Search listings, get CV-based application advice for a specific job, and navigate TheBoard."
    >
      <JobFinderAgent listings={listings} />
    </PageShell>
  );
}
