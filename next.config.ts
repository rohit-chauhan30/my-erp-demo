import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 🚀 Deploy ke time type errors ko ignore karega
    ignoreBuildErrors: true,
  },
  eslint: {
    // 🚀 ESLint errors bhi ignore ho jayenge
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
