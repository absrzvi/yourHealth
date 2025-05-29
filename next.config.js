/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This makes env vars available to Edge Runtime (middleware)
    serverComponentsExternalPackages: [],
  },
  env: {
    // Explicitly expose these environment variables to all environments
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig
