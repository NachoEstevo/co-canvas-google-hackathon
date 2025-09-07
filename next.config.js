/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix TLDRAW bundling issues
  transpilePackages: [
    'tldraw',
    '@tldraw/sync'
  ],
  webpack: (config, { isServer }) => {
    // Fix multiple instance issues with tldraw
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'tldraw': require.resolve('tldraw'),
        '@tldraw/sync': require.resolve('@tldraw/sync')
      }
    }
    return config
  },
}

module.exports = nextConfig