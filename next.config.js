/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Agar gambar dari API eksternal load tanpa error domain
  },
};

module.exports = nextConfig;
