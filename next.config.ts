import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  eslint: {
    dirs: ["src", "workers"],
  },
};

export default nextConfig;
