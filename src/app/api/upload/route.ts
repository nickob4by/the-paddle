import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload a JPG, PNG, or WebP image.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const ext = path.extname(file.name) || '.png';
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${timestamp}-${baseName}${ext}`;

    // If deployed on Vercel with Vercel Blob Storage enabled
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`uploads/${fileName}`, buffer, {
        access: 'public',
        contentType: file.type
      });

      return NextResponse.json({
        success: true,
        url: blob.url,
        fileName
      });
    }

    // Local disk fallback for local development
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
  }
}
