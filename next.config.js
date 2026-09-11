const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Dev builds go to .next-dev so `next dev` and `next build` never fight over
    // the same directory (that collision corrupts the running dev server).
    distDir: isDev ? ".next-dev" : ".next",
    // Container-friendly output for Cloud Run / Docker deploys.
    output: "standalone",
    reactStrictMode: true,
    // Course/thumbnail images may live on any host (YouTube thumbnails, Google Drive, CDN...)
    images: {
      remotePatterns: [{ protocol: "https", hostname: "**" }],
    },
  };
};
