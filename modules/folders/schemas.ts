import { z } from "zod";

export const folderSchema = z.object({
  name: z.string().min(2).max(80),
  scope: z.enum(["PROJECT"]),
  parentFolderId: z.string().cuid().optional().or(z.literal("")),
});
