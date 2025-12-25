const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment (Vercel ignores this)
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // Disable ESLint during build to avoid CI failures when eslint peers differ.
  // Linting should be run locally or in CI separately (npm run lint).
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack configuration for path aliases
  webpack: (config) => {
    const rootPath = path.resolve(__dirname)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': rootPath,
    }
    // Ensure extensions are resolved correctly
    config.resolve.extensions = [
      ...config.resolve.extensions,
      '.ts',
      '.tsx',
    ]
    return config
  },
  // Security headers (some are handled by middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig




