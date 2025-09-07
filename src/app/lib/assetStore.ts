// Custom asset store that enables image uploads by storing them as base64 data URLs
export class CustomAssetStore {
  async upload(asset: unknown, file: File): Promise<{ src: string }> {
    console.log('🚀 CustomAssetStore.upload() called!', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      asset
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

  resolve(asset: { props: { src: string } }): string {
    // For base64 data URLs, we just return them as-is
    // No additional resolution needed
    console.log('🔍 CustomAssetStore: Resolving asset src:', asset.props.src.substring(0, 50) + '...')
    
    return asset.props.src
  }
}

export const customAssetStore = new CustomAssetStore()