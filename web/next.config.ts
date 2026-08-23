import type { NextConfig } from 'next';

const apiBaseUrl = (process.env.API_BASE_URL || 'https://events-api.aahaas.com/api').replace(/\/$/, '');
const backendOrigin = new URL(apiBaseUrl).origin;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiBaseUrl}/:path*` },
      { source: '/media/:path*', destination: `${backendOrigin}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
