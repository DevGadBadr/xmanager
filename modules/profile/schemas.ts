import { z } from "zod";

import { DEPARTMENT_OPTIONS } from "@/modules/invitations/schemas";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(100),
  department: z.enum(DEPARTMENT_OPTIONS),
});

export const avatarUrlSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value.length === 0 || z.string().url().safeParse(value).success, {
      message: "Enter a valid image URL or leave the field empty.",
    }),
});
