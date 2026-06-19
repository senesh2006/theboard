import { Role } from "@prisma/client";
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  district: z.string().max(100).optional().nullable(),
  skills: z.array(z.string().min(1).max(50)).max(20).default([]),
  role: z.nativeEnum(Role),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const profileUpdateSchema = profileSchema.omit({ role: true });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
