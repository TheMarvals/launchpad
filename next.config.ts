import type { NextConfig } from "next";

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
};

export default nextConfig;
