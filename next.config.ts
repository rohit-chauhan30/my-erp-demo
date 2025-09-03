import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Linting errors build ko fail nahi karenge
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
