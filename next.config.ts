import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Stub optional native/Node modules that wagmi's deps try to resolve in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    };
    return config;
  },
};

export default nextConfig;
