import { createRequire } from 'module'
const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix TLDRAW bundling issues
  transpilePackages: [
    'tldraw',
    '@tldraw/sync',
    '@tldraw/utils',
    '@tldraw/state',
    '@tldraw/state-react',
    '@tldraw/store',
    '@tldraw/validate',
    '@tldraw/tlschema',
    '@tldraw/editor',
    '@tldraw/sync-core'
  ],
  webpack: (config, { isServer }) => {
    // Fix multiple instance issues with tldraw - more conservative approach
    config.resolve.alias = {
      ...config.resolve.alias,
      'tldraw': require.resolve('tldraw'),
      '@tldraw/sync': require.resolve('@tldraw/sync'),
      '@tldraw/utils': require.resolve('@tldraw/utils'),
      '@tldraw/state': require.resolve('@tldraw/state'),
      '@tldraw/state-react': require.resolve('@tldraw/state-react'),
      '@tldraw/store': require.resolve('@tldraw/store'),
      '@tldraw/validate': require.resolve('@tldraw/validate'),
      '@tldraw/tlschema': require.resolve('@tldraw/tlschema'),
      '@tldraw/editor': require.resolve('@tldraw/editor'),
      '@tldraw/sync-core': require.resolve('@tldraw/sync-core')
    }
    
    // Ensure single instance across both client and server
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    return config
  },
}

export default nextConfig