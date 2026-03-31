import type { NextConfig } from "next";

import { APP_BASE_PATH } from "./lib/auth-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
