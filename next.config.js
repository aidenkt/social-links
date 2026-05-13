const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Parent folder has its own lockfile; without this, Next infers the repo root above
  // this app and breaks module resolution (e.g. react-server-dom-webpack) and routes.
  turbopack: {
    root: path.join(__dirname),
  },
}

module.exports = nextConfig
