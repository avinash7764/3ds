const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    distDir: isDev ? ".next-dev" : ".next",
    output: "standalone",
    reactStrictMode: true,
    eslint: {
      ignoreDuringBuilds: true,
    },
    // Course/thumbnail images may live on any host (YouTube thumbnails, Google Drive, CDN...)
    images: {
      remotePatterns: [{ protocol: "https", hostname: "**" }],
    },
    experimental: {
      serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    },
  };
};

