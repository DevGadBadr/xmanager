import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
  dueDate: z.string().optional().or(z.literal("")),
});

export const projectContentUpdateSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const projectDeleteSchema = z.object({
  projectId: z.string().cuid(),
});
