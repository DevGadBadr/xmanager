import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional().or(z.literal("")),
  managerMembershipId: z.string().cuid().optional().or(z.literal("")),
});
