import { z } from "zod";

export const projectSchema = z.object({
  folderId: z.string().cuid().optional().or(z.literal("")),
  name: z.string().min(2).max(100),
  key: z
    .string()
    .min(2)
    .max(12)
    .regex(/^[A-Z0-9]+$/),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
  dueDate: z.string().optional().or(z.literal("")),
});
