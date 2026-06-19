import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== Role.ADMIN) redirect("/");

  return (
    <PageShell
      title="Admin panel"
      description="Moderation tools arrive in Phase 5."
    >
      <Card>
        <p className="text-sm text-slate-600">
          Signed in as admin ({user.email}). Flagged listings, report resolution, and poster
          approval will be built in Phase 5.
        </p>
      </Card>
    </PageShell>
  );
}
