import type { Configuration } from 'webpack';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config: Configuration) {
    config.module?.rules?.push({ test: /\.md$/, type: 'asset/source' });
    return config;
  },
};

export default nextConfig;
