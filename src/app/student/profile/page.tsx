import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { StudentProfileEditor } from "@/components/profile/student-profile-editor";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default async function StudentProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.STUDENT) redirect("/");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      district: true,
      skills: true,
      cvSummary: true,
      cvEducation: true,
      cvExperience: true,
    },
  });

  if (!profile) redirect("/login");

  return (
    <PageShell
      title="Your profile & CV"
      description="Keep your profile updated and build a CV the Job Agent can review when you apply."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/student/agent" variant="secondary">
            Job Agent
          </Button>
          <Button href="/student/dashboard" variant="secondary">
            Dashboard
          </Button>
        </div>
      }
    >
      <StudentProfileEditor initial={profile} redirectTo="/student/dashboard" />
    </PageShell>
  );
}
