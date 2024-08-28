/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'p16-sign-useast2a.tiktokcdn.com',
        port: '',
        pathname: '/**',
      },
      // Add more patterns as needed
    ],
  },
}

module.exports = nextConfig