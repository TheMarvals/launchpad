import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  transpilePackages: ['@novnc/novnc'],
  serverExternalPackages: ['ssh2-sftp-client', 'ssh2'],
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.1.105', 'localhost:3000', 'localhost:3010'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);

