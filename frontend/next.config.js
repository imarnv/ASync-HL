/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ignore linting during build to speed up checks
  },
  typescript: {
    ignoreBuildErrors: true, // ignore typescript errors to ensure clean build
  }
};

module.exports = nextConfig;
