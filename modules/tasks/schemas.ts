import { z } from "zod";

export const taskSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(2).max(140),
  description: z.string().max(1000).optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeMembershipIds: z.array(z.string().cuid()).default([]),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export const taskUpdateSchema = z.object({
  taskId: z.string().cuid(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assigneeMembershipIds: z.array(z.string().cuid()).default([]),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

export const taskContentUpdateSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(2).max(140),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export const taskCommentSchema = z.object({
  taskId: z.string().cuid(),
  body: z.string().min(1).max(1000),
});

export const taskCommentUpdateSchema = z.object({
  commentId: z.string().cuid(),
  body: z.string().min(1).max(1000),
});

export const taskCommentDeleteSchema = z.object({
  commentId: z.string().cuid(),
});

export const taskDeleteSchema = z.object({
  taskId: z.string().cuid(),
});
