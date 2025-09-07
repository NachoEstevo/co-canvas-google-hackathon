import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

// Initialize R2 client using Cloudflare R2 with S3-compatible API
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log('📁 R2 Asset upload API called')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📄 Processing file upload to R2:', {
      name: file.name,
      size: file.size,
      type: file.type,
      bucket: process.env.R2_BUCKET_NAME
    })

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'bin'
    const uniqueFilename = `assets/${uuidv4()}.${fileExtension}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000', // 1 year cache
      ACL: 'public-read', // Make the object publicly readable
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      }
    })

    const uploadResult = await r2Client.send(uploadCommand)
    
    // Construct the public URL for R2
    // Try multiple R2 URL formats to ensure compatibility
    const possibleUrls = [
      `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFilename}`,
      `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${uniqueFilename}`,
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${uniqueFilename}`
    ]
    
    // Use the first URL format for now, but log all options
    const publicUrl = possibleUrls[0]
    
    console.log('📍 Possible R2 URLs:', possibleUrls)

    console.log('✅ File uploaded to R2 successfully:', {
      key: uniqueFilename,
      url: publicUrl,
      etag: uploadResult.ETag
    })

    return NextResponse.json({ 
      src: publicUrl,
      success: true,
      key: uniqueFilename,
      size: file.size
    })

  } catch (error) {
    console.error('❌ R2 asset upload failed:', error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    )
  }
}