import type { TLAssetStore, TLAsset, TLAssetContext } from 'tldraw'

// Custom asset store that enables image uploads by storing them in R2
export class CustomAssetStore implements TLAssetStore {
  async upload(asset: TLAsset, file: File): Promise<{ src: string }> {
    console.log('🚀 CustomAssetStore.upload() called!', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      assetId: asset.id
    })

    try {
      // Upload via our API endpoint
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('📤 Uploading to /api/upload/asset...')
      const response = await fetch('/api/upload/asset', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('🎉 Upload successful via API:', result)
      
      return { src: result.src }
      
    } catch (error) {
      console.error('💥 Upload failed:', error)
      throw error
    }
  }

  resolve(asset: TLAsset, ctx: TLAssetContext): string | Promise<string | null> | null {
    // Handle the case where src might be null
    if (asset.type === 'image' && asset.props.src) {
      // Handle R2 URLs - proxy old private URLs, direct access for new public URLs
      if (asset.props.src.includes('idea-fusion.0236038de169a8251e3492c5d72e7d02.r2.cloudflarestorage.com')) {
        // Old private R2 URL - use proxy to avoid CORS issues
        const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(asset.props.src)}`
        console.log('🔍 CustomAssetStore: Using proxy for old R2 asset:', proxyUrl)
        return proxyUrl
      } else if (asset.props.src.includes('pub-bf93ed9de7d9453885219b237362e9e7.r2.dev')) {
        // New public R2 URL - use direct access (no CORS issues)
        console.log('🔍 CustomAssetStore: Using direct access for new public R2 asset:', asset.props.src)
        return asset.props.src
      }
      
      console.log('🔍 CustomAssetStore: Resolving direct asset src:', asset.props.src.substring(0, 50) + '...')
      return asset.props.src
    }
    
    // Return null if we can't resolve the asset
    console.warn('⚠️ Cannot resolve asset:', asset.id, asset.type)
    return null
  }
}

export const customAssetStore = new CustomAssetStore()