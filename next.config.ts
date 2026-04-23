import type { NextConfig } from "next";

import { APP_BASE_PATH, IS_DEVELOPMENT_APP } from "./lib/auth-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH || undefined,
  allowedDevOrigins: IS_DEVELOPMENT_APP ? ["devgadbadr.me"] : undefined,
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
