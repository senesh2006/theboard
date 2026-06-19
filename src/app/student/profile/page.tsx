import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default async function StudentProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.STUDENT) redirect("/");

  return (
    <PageShell
      title="Your profile"
      description="Keep your district and skills up to date for better matches."
      actions={
        <Link href="/student/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      }
    >
      <ProfileForm
        initial={{
          name: user.name,
          district: user.district,
          skills: user.skills,
        }}
        redirectTo="/student/dashboard"
      />
    </PageShell>
  );
}
