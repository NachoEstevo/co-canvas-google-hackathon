/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix TLDRAW bundling issues
  transpilePackages: [
    'tldraw',
    '@tldraw/tldraw', 
    '@tldraw/editor',
    '@tldraw/store',
    '@tldraw/state',
    '@tldraw/state-react',
    '@tldraw/utils',
    '@tldraw/validate',
    '@tldraw/tlschema'
  ],
}

module.exports = nextConfig