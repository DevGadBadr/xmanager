import { z } from "zod";

export const DEPARTMENT_OPTIONS = [
  "Automation and SCADA",
  "Tender and Planning",
] as const;

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "TEAM_MANAGER", "MEMBER"]),
  teamId: z.string().cuid().optional().or(z.literal("")),
});

export const onboardingSchema = z
  .object({
    token: z.string().min(1),
    fullName: z.string().min(2).max(100),
    title: z.string().min(2).max(100),
    department: z.enum(DEPARTMENT_OPTIONS),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
