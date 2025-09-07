import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { roomId, snapshot, timestamp } = await request.json();

    if (!roomId || !snapshot) {
      return NextResponse.json(
        { error: 'Missing roomId or snapshot data' },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const saveId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filename = `canvas-saves/${roomId}/${saveId}.json`;

    // Prepare the save data
    const saveData = {
      id: saveId,
      roomId,
      snapshot,
      timestamp: timestamp || Date.now(),
      createdAt: new Date().toISOString(),
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(saveData, null, 2);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filename,
      Body: jsonData,
      ContentType: 'application/json',
      Metadata: {
        roomId,
        saveId,
        timestamp: (timestamp || Date.now()).toString(),
      },
    });

    await s3Client.send(command);

    // Return success response
    return NextResponse.json({
      success: true,
      id: saveId,
      filename,
      timestamp: saveData.timestamp,
      message: 'Canvas saved successfully'
    });

  } catch (error) {
    console.error('Error saving canvas to R2:', error);
    return NextResponse.json(
      { error: 'Failed to save canvas data' },
      { status: 500 }
    );
  }
}