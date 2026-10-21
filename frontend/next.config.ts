import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    const rawBackend =
      process.env.API_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' || process.env.VERCEL
        ? 'https://dexar-7v5o.onrender.com'
        : 'http://localhost:5000');

    const cleanBackend = rawBackend.trim().replace(/\/+$/, '').replace(/\/api$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${cleanBackend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
