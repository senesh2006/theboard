import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { ListingForm } from "@/components/listings/listing-form";
import { PageShell } from "@/components/layout/page-shell";

export default async function NewListingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/listings/new");
  if (user.role !== Role.POSTER && user.role !== Role.ADMIN) redirect("/");

  return (
    <PageShell
      title="Post a role"
      description="Share an internship or gig with students on the board."
    >
      <ListingForm />
    </PageShell>
  );
}
