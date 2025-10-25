import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress hydration warnings for browser extensions
  reactStrictMode: true,
  // Enable standalone output for Docker builds
  output: 'standalone',
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['@heroicons/react']
  },
  // Custom webpack config to handle hydration mismatches
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: {
              ...config.optimization.splitChunks.cacheGroups.default,
              enforce: false,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
