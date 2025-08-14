import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate unique build ID to prevent cache conflicts
  generateBuildId: async () => {
    // Use environment variable or timestamp for unique builds
    return process.env.GIT_SHA || process.env.BUILD_ID || Date.now().toString();
  },

  // Webpack configuration for better chunk handling
  webpack: (config, { buildId, dev, isServer }) => {
    // Ensure consistent chunk naming in development
    if (dev && !isServer) {
      config.output = {
        ...config.output,
        filename: 'static/chunks/[name].js',
        chunkFilename: 'static/chunks/[name].js',
      };
    }

    // Prevent webpack from caching aggressively in development
    if (dev) {
      config.cache = false;
    }

    return config;
  },

  // Headers for better cache control
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        // Match all static files
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Experimental features for better caching
  experimental: {
    // Improve build performance
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;
