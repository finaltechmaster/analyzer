/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['p16-sign-useast2a.tiktokcdn.com'], // Fügen Sie hier die Domain(s) hinzu, von denen Sie Bilder laden
  },
}

module.exports = nextConfig