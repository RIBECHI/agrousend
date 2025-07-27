
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow data URLs for Base64 images
    domains: [],
    unoptimized: false,
    loader: 'default',
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
        {
          protocol: 'https',
          hostname: 'placehold.co',
          port: '',
          pathname: '/**',
        },
        // Remove the googleapis remote pattern
    ],
    // The new section to allow Data URLs
    path: '/_next/image',
    loaderFile: '',
    loader: 'default', // Add this line
    // Add this to allow data URLs
    domains: [],
    // This allows data URIs which start with `data:`
    // The previous configuration was wrong
     remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'data',
        hostname: '',
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push('node:fs');
    }
    // I need to add this to fix the base64 image loading
     config.module.rules.push({
      test: /\.(bin)$/i,
      type: 'asset/resource',
    })
    return config
  },
};

export default nextConfig;

    