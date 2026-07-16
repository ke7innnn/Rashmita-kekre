import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/crm360',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
