import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Court } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    let res;
    if (includeInactive) {
      res = await db.execute('SELECT * FROM courts ORDER BY createdAt ASC');
    } else {
      res = await db.execute('SELECT * FROM courts WHERE isActive = 1 ORDER BY createdAt ASC');
    }

    const courts = res.rows as unknown as Court[];
    return NextResponse.json(
      { success: true, courts },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching courts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch courts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, surfaceType, hourlyRate, isActive = 1, imageUrl = '' } = body;

    if (!name || hourlyRate === undefined || hourlyRate === null) {
      return NextResponse.json({ success: false, error: 'Court name and hourly rate are required' }, { status: 400 });
    }

    const id = 'court-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO courts (id, name, description, surfaceType, hourlyRate, isActive, imageUrl, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, description || '', surfaceType || 'Standard Hardcourt', Number(hourlyRate), isActive ? 1 : 0, imageUrl, createdAt]
    });

    const res = await db.execute({ sql: 'SELECT * FROM courts WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true, court: res.rows[0] });
  } catch (error) {
    console.error('Error adding court:', error);
    return NextResponse.json({ success: false, error: 'Failed to create court' }, { status: 500 });
  }
}
