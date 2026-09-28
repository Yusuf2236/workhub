const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://wzone_backend:8080';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'wzone.uz', 'lh3.googleusercontent.com', 'images.unsplash.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
