import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@berber/shared"],
  poweredByHeader: false,
};

export default nextConfig;
