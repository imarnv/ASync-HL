import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pinned so a lockfile in a parent folder can't be inferred as the root.
  turbopack: {
    root: __dirname,
  },
  // TypeScript 7 dropped the compiler API Next reaches for by default.
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
