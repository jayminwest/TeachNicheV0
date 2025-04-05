/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Support external image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] + '.supabase.co',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 1 year (31536000 seconds)
    minimumCacheTTL: 31536000,
    // Default image sizes for srcset generation
    deviceSizes: [480, 768, 1024, 1280, 1920],
    // Default image sizes for non-device images (icons, thumbnails, etc.)
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Configure proper content-based hashing for asset versioning
  output: 'standalone',
  // Generate ETags for static assets
  generateEtags: true,
  // Enable compression for responses
  compress: true,
  // Customize headers for static assets
  async headers() {
    return [
      {
        // Apply to all static assets
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

export default nextConfig
