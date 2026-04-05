import { z } from "zod";

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z
  .object({
    email: z.string().email(),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
