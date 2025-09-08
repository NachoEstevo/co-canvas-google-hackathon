import { NextRequest, NextResponse } from 'next/server'

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    console.log('🔍 Proxy request for URL:', imageUrl)
    
    if (!imageUrl) {
      console.error('❌ No URL parameter provided')
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
    }

    // Validate that it's from our R2 bucket
    if (!imageUrl.includes('idea-fusion.0236038de169a8251e3492c5d72e7d02.r2.cloudflarestorage.com')) {
      console.error('❌ Invalid image URL - not from our R2 bucket:', imageUrl)
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }
    
    console.log('✅ URL validation passed, fetching from R2...')

    // Fetch the image from R2
    console.log('📡 Fetching from R2:', imageUrl)
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Co-Canvas/1.0)',
      }
    })
    
    console.log('📡 R2 Response status:', response.status, response.statusText)

    if (!response.ok) {
      console.error('❌ Failed to fetch image from R2:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}