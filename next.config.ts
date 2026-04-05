import type { NextConfig } from "next";

import { APP_BASE_PATH, IS_DEVELOPMENT_APP } from "./lib/auth-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH || undefined,
  allowedDevOrigins: IS_DEVELOPMENT_APP ? ["devgadbadr.com"] : undefined,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
