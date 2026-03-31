import { getEnv } from "@/lib/env";

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
});
