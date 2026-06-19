export type { Role, ListingStatus, ApplicationStatus, ReportStatus } from "@prisma/client";

export type SavedSearchFilters = {
  q?: string;
  district?: string;
  remote?: boolean;
  partTime?: boolean;
};
