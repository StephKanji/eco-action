import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    preloadEntriesOnStart: true,
  },
};

export default nextConfig;