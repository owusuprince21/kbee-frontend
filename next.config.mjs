/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep other config ...
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ];
  },
  async rewrites() {
    // If NEXT_PUBLIC_API_PROXY is set, use it; otherwise fall back to localhost:8000
    const target = process.env.NEXT_PUBLIC_API_PROXY || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
