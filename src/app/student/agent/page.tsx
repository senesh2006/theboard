import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { PageShell } from "@/components/layout/page-shell";
import { JobFinderAgent } from "@/components/agent/job-finder-agent";

export default async function StudentAgentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/student/agent");
  if (user.role !== Role.STUDENT) redirect("/");

  return (
    <PageShell
      title="Job Finder Agent"
      description="An AI assistant that searches listings, matches jobs to your profile, and navigates TheBoard for you."
    >
      <JobFinderAgent />
    </PageShell>
  );
}
