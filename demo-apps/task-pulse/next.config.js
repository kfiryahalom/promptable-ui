/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['promptable-ui'],
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
