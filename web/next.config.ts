import type { NextConfig } from 'next';

const apiBaseUrl = (process.env.API_BASE_URL || 'https://events-api.aahaas.com/api').replace(/\/$/, '');
const backendOrigin = new URL(apiBaseUrl).origin;

const nextConfig: NextConfig = {
  // The server deploy (deploy/deploy.sh) builds into a side folder while the
  // live site keeps serving `.next`, then swaps the folders — so a failed
  // build never takes the site down. Unset everywhere else.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
