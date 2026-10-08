/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Behind nginx the admin is served under /admin (ADMIN_BASE_PATH=/admin at build time)
  basePath: process.env.ADMIN_BASE_PATH || '',
};

module.exports = nextConfig;
