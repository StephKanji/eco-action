import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    preloadEntriesOnStart: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sjglknwoqeaznwkyttgm.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};
export default nextConfig;