// PWA configuration for Vercel deployment
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
//   // Vercel-specific optimizations
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
//       handler: 'CacheFirst',
//       options: {
//         cacheName: 'supabase-cache',
//         expiration: {
//           maxEntries: 32,
//           maxAgeSeconds: 24 * 60 * 60 // 24 hours
//         }
//       }
//     }
//   ]
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel optimizations
  serverExternalPackages: ['@google/generative-ai'],
  typescript: {
    // Enable strict TypeScript checking for production
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vercel.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    // Optimize images for Vercel Edge
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable typed routes for better developer experience
  typedRoutes: true,
  // Turbopack for faster builds in development
  turbopack: {
    root: __dirname,
  },
  // Vercel-specific optimizations
  poweredByHeader: false,
  compress: true,
};

// Export configuration (uncomment withPWA if PWA is needed)
module.exports = nextConfig;
// module.exports = withPWA(nextConfig);