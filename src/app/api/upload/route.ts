import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { put } from '@vercel/blob';
import db from '@/lib/db';

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

    // If Cloudinary credentials are provided (Works on Cloudflare Pages, Netlify, Render, etc.)
    if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });

      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'the-paddle', resource_type: 'image' },
          (err, result) => {
            if (err || !result) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        fileName
      });
    }

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

    // Persistent Storage in Turso Cloud Database
    const base64Data = buffer.toString('base64');
    const fileId = `file-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      await db.execute({
        sql: `INSERT OR REPLACE INTO uploaded_files (id, filename, mimeType, data, size, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          fileId,
          fileName,
          file.type,
          base64Data,
          buffer.length,
          new Date().toISOString()
        ]
      });
    } catch (dbErr) {
      console.warn('Failed to persist file in Turso database:', dbErr);
    }

    // Optional local disk cache for fast local access
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
    } catch {
      // Ignored if local filesystem is read-only or ephemeral
    }

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
