import { Role, ListingStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { FloatingAgentAssistant } from "@/components/agent/floating-agent-assistant";

export async function StudentFloatingAgent() {
  const user = await getSessionUser();
  if (!user || user.role !== Role.STUDENT) {
    return null;
  }

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

  return <FloatingAgentAssistant listings={listings} />;
}
