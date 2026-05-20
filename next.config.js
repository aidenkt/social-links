const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Parent folder has its own lockfile; without this, Next infers the repo root above
  // this app and breaks module resolution (e.g. react-server-dom-webpack) and routes.
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
