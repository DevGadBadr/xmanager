import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { getEnv } from "../lib/env";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const env = getEnv();

  console.log(
    [
      "Primary owner bootstrap is handled on first Google sign-in.",
      `Default owner email: ${env.DEFAULT_OWNER_EMAIL}`,
      `Default workspace name: ${env.DEFAULT_WORKSPACE_NAME}`,
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
