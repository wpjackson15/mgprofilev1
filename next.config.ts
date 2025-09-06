import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Suppress hydration warnings from browser extensions
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Node.js modules on the client to prevent build errors
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        'timers/promises': false,
        kerberos: false,
        '@mongodb-js/zstd': false,
        '@aws-sdk/credential-providers': false,
        snappy: false,
        socks: false,
        aws4: false,
        'mongodb-client-encryption': false,
      };
    }
    return config;
  },
};

export default nextConfig;
