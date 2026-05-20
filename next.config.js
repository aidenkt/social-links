const path = require('path')

const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(
  /\/$/,
  ''
)

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
        destination: `${posthogHost}/static/:path*`,
      },
      {
        source: '/ingest/array/:path*',
        destination: `${posthogHost}/array/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${posthogHost}/:path*`,
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
