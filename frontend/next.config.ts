import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail production builds on type errors / lint errors (default, kept explicit
  // for clarity). Flip these to `true` only as a temporary escape hatch.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Add remote domains here as the app grows, e.g.:
  // images: {
  //   remotePatterns: [{ protocol: "https", hostname: "example.com" }],
  // },
};

export default nextConfig;
