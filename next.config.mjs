/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '*.run.app',
    '*.asia-southeast1.run.app',
    '*.google.com',
    '*.aistudio.google.com',
    'localhost:3000',
    '127.0.0.1:3000',
    'ais-dev-tfhbziitsckmswamap5nyy-696358354473.asia-southeast1.run.app',
  ],
}

export default nextConfig
