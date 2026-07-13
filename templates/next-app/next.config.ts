import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/config', destination: 'http://localhost:5001/config' },
      {
        source: '/config/:path*',
        destination: 'http://localhost:5001/config/:path*',
      },
    ]
  },
}

export default nextConfig
