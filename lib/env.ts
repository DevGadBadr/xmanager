import { z } from "zod";

const appEnvironmentSchema = z.enum(["development", "production"]);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  APP_ENV: appEnvironmentSchema.optional(),
  APP_BASE_PATH: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  MAILTRAP_HOST: z.string().min(1),
  MAILTRAP_PORT: z.coerce.number().int().positive(),
  MAILTRAP_USERNAME: z.string().min(1),
  MAILTRAP_PASSWORD: z.string().min(1),
  MAIL_FROM_EMAIL: z.string().email(),
  MAIL_FROM_NAME: z.string().min(1),
  APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: appEnvironmentSchema.optional(),
  NEXT_PUBLIC_APP_BASE_PATH: z.string().optional(),
  INVITE_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(168),
  DEFAULT_WORKSPACE_NAME: z.string().min(1).default("Flow Workspace"),
  DEFAULT_OWNER_EMAIL: z.string().email().default("owner@example.com"),
});

type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
