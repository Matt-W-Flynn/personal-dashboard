/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['static2.finnhub.io', 's.yimg.com', 'static.seekingalpha.com'],
  },
}

module.exports = nextConfig 