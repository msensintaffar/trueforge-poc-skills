/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the build's worker pool small so it fits in constrained
  // build environments (containers with tight memory limits).
  experimental: { cpus: 2 },
};

module.exports = nextConfig;
