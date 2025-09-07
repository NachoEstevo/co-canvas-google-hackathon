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
      console.log('🔍 CustomAssetStore: Resolving asset src:', asset.props.src.substring(0, 50) + '...')
      return asset.props.src
    }
    
    // Return null if we can't resolve the asset
    console.warn('⚠️ Cannot resolve asset:', asset.id, asset.type)
    return null
  }
}

export const customAssetStore = new CustomAssetStore()