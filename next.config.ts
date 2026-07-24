import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/crm360/login',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/crm360',
        permanent: true,
      },
      {
        source: '/crm',
        destination: '/crm360',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/crm360',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
