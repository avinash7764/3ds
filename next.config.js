/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Course/thumbnail images may live on any host (YouTube thumbnails, Google Drive, CDN...)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
