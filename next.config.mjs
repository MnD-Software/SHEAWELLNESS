/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false
};

export default nextConfig;
