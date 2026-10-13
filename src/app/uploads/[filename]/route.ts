import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      const ext = path.extname(safeFilename).toLowerCase();
      let contentType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.svg') contentType = 'image/svg+xml';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
        }
      });
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error serving upload:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
