
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['react-map-gl', 'mapbox-gl-draw'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      }
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
  env: {
    NEXT_PUBLIC_MAPTILER_KEY: 'YOUR_MAPTILER_API_KEY',
  }
};

export default nextConfig;
