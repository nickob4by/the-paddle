import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Court } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const res = await db.execute('SELECT * FROM courts ORDER BY createdAt ASC');

    const rawCourts = res.rows as unknown as Court[];
    const courts = rawCourts.map((c: any) => ({
      ...c,
      pricingRules: typeof c.pricingRules === 'string' ? (() => {
        try { return JSON.parse(c.pricingRules); } catch { return []; }
      })() : (c.pricingRules || [])
    }));

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
    const { name, description, surfaceType, hourlyRate, isActive = 1, imageUrl = '', pricingRules = [] } = body;

    if (!name || hourlyRate === undefined || hourlyRate === null) {
      return NextResponse.json({ success: false, error: 'Court name and hourly rate are required' }, { status: 400 });
    }

    const id = 'court-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();
    const rulesJson = typeof pricingRules === 'string' ? pricingRules : JSON.stringify(pricingRules || []);

    await db.execute({
      sql: `INSERT INTO courts (id, name, description, surfaceType, hourlyRate, pricingRules, isActive, imageUrl, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, description || '', surfaceType || 'Standard Hardcourt', Number(hourlyRate), rulesJson, isActive ? 1 : 0, imageUrl, createdAt]
    });

    const res = await db.execute({ sql: 'SELECT * FROM courts WHERE id = ?', args: [id] });
    const rawCourt = res.rows[0] as any;
    const court = rawCourt ? {
      ...rawCourt,
      pricingRules: typeof rawCourt.pricingRules === 'string' ? (() => {
        try { return JSON.parse(rawCourt.pricingRules); } catch { return []; }
      })() : (rawCourt.pricingRules || [])
    } : null;

    return NextResponse.json({ success: true, court });
  } catch (error) {
    console.error('Error adding court:', error);
    return NextResponse.json({ success: false, error: 'Failed to create court' }, { status: 500 });
  }
}
