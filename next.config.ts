
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Prohibit builds with type errors in production
    ignoreBuildErrors: false,
  },
  eslint: {
    // Prohibit builds with ESLint errors in production
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push('node:fs');
    }
    config.module.rules.push({
      test: /\.(bin)$/i,
      type: 'asset/resource',
    })
    return config
  },
};

export default nextConfig;
