import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default async function PosterProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.POSTER) redirect("/");

  return (
    <PageShell
      title="Your profile"
      description="Update your contact details shown to applicants."
      actions={
        <Link href="/poster/dashboard">
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
        redirectTo="/poster/dashboard"
      />
    </PageShell>
  );
}
