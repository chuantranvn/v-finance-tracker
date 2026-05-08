/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['motion', 'framer-motion', 'lucide-react'],
  experimental: {
    serverExternalPackages: ['firebase'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
