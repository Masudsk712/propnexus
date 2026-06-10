import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Image Optimization ──────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // ── Compression ─────────────────────────────────────────────────────────
  compress: true,

  // ── Caching & Stale-Revalidation Headers ────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },

  // ── Bundle / Build Optimizations ────────────────────────────────────────
  poweredByHeader: false,
  reactStrictMode: true,

  // ── Optimize heavy package imports (Next.js 15 native tree-shaking) ────
  experimental: {
    // CSS optimization only in production (speeds up dev HMR)
    optimizeCss: process.env.NODE_ENV === "production",
    scrollRestoration: true,
    // Optimize barrel-file imports from these heavy packages
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "@tanstack/react-query",
    ],
  },

  // ── Keep socket.io and Prisma server-side only ──────────────────────────
  serverExternalPackages: ["socket.io", "socket.io-client"],

  // ── Webpack ─────────────────────────────────────────────────────────────
  webpack: (config, { dev, isServer }) => {
    // Tree-shake and minimize in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            // Separate heavy chart library
            charts: {
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              name: "charts",
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate framer-motion
            animations: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: "animations",
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate socket.io
            socket: {
              test: /[\\/]node_modules[\\/](socket\.io|engine\.io)[\\/]/,
              name: "socket-io",
              priority: 10,
              reuseExistingChunk: true,
              // Socket.IO is never used on the server bundle
              enforce: !isServer,
            },
            // Vendor commons
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Exclude Node.js built-ins from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    // Disable Webpack cache in development to reduce disk I/O
    if (dev) {
      config.cache = false;
    }

    return config;
  },

  // ── Output ──────────────────────────────────────────────────────────────
  // NOTE: "standalone" output is NOT used for Vercel deployments.
  // Vercel automatically optimizes for serverless when build runs on its platform.
  // output: "standalone",

  // ── Production Source Maps ──────────────────────────────────────────────
  productionBrowserSourceMaps: false,

  // ── Logging ─────────────────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;