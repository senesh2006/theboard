import { z } from "zod";

export const listingCreateSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  district: z.string().max(100).optional().nullable(),
  isRemote: z.boolean().default(false),
  isPartTime: z.boolean().default(false),
  skillsRequired: z.array(z.string().min(1).max(50)).max(20).default([]),
  deadline: z.coerce.date().optional().nullable(),
});

export const listingBrowseFiltersSchema = z.object({
  q: z.string().max(200).optional(),
  district: z.string().max(100).optional(),
  remote: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  partTime: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingBrowseFilters = z.infer<typeof listingBrowseFiltersSchema>;

export type ListingQueryFilters = Pick<
  ListingBrowseFilters,
  "q" | "district" | "remote" | "partTime"
>;
