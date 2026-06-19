import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

export const applicationCreateSchema = z.object({
  listingId: z.string().min(1),
});

export const applicationStatusUpdateSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationStatusUpdateInput = z.infer<
  typeof applicationStatusUpdateSchema
>;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  VIEWED: "Viewed",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};
