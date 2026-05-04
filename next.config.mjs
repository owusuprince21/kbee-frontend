/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep other config ...
  async rewrites() {
    // If NEXT_PUBLIC_API_PROXY is set, use it; otherwise fall back to localhost:8000
    const target = process.env.NEXT_PUBLIC_API_PROXY || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
