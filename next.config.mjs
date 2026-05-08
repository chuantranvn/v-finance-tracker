/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['motion', 'lucide-react'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
