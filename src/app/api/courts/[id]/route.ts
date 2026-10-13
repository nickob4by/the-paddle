import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, surfaceType, hourlyRate, isActive, imageUrl } = body;

    const existing = await db.execute({ sql: 'SELECT * FROM courts WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Court not found' }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE courts
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                surfaceType = COALESCE(?, surfaceType),
                hourlyRate = COALESCE(?, hourlyRate),
                isActive = COALESCE(?, isActive),
                imageUrl = COALESCE(?, imageUrl)
            WHERE id = ?`,
      args: [
        name !== undefined ? name : null,
        description !== undefined ? description : null,
        surfaceType !== undefined ? surfaceType : null,
        hourlyRate !== undefined ? Number(hourlyRate) : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        imageUrl !== undefined ? imageUrl : null,
        id
      ]
    });

    const updated = await db.execute({ sql: 'SELECT * FROM courts WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true, court: updated.rows[0] });
  } catch (error) {
    console.error('Error updating court:', error);
    return NextResponse.json({ success: false, error: 'Failed to update court' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await db.execute({ sql: 'SELECT * FROM courts WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Court not found' }, { status: 404 });
    }

    await db.execute({ sql: 'DELETE FROM courts WHERE id = ?', args: [id] });

    return NextResponse.json({ success: true, message: 'Court deleted successfully' });
  } catch (error) {
    console.error('Error deleting court:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete court' }, { status: 500 });
  }
}
