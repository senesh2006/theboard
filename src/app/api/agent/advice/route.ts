import { Role, ListingStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { generateJobApplicationAdvice } from "@/lib/agent/advice";
import { cvHasContent } from "@/lib/cv/build-cv";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { agentAdviceSchema } from "@/lib/validations/agent";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== Role.STUDENT) {
    return jsonError("Only students can request application advice", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = agentAdviceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

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

  if (!profile) return jsonError("Profile not found", 404);

  const cv = {
    cvSummary: profile.cvSummary,
    cvEducation: profile.cvEducation,
    cvExperience: profile.cvExperience,
  };

  if (!cvHasContent(cv)) {
    return jsonError(
      "Add your CV on your profile first (use “Add profile to CV” on /student/profile).",
      400,
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: {
      id: true,
      title: true,
      description: true,
      district: true,
      isRemote: true,
      isPartTime: true,
      skillsRequired: true,
      status: true,
    },
  });

  if (!listing || listing.status !== ListingStatus.ACTIVE) {
    return jsonError("Job listing not found or no longer active", 404);
  }

  try {
    const advice = await generateJobApplicationAdvice({
      profile,
      cv,
      listing,
    });

    return jsonOk({
      advice,
      listing: {
        id: listing.id,
        title: listing.title,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate advice";
    console.error("Agent advice error:", error);
    return jsonError(message, 502);
  }
}
