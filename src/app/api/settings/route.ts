import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { SystemSettings } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const res = await db.execute({
      sql: 'SELECT id, gcashQrUrl, gcashAccountName, gcashNumber, courtOpenTime, courtCloseTime, updatedAt FROM settings WHERE id = ?',
      args: ['default']
    });

    const settings = res.rows[0] as unknown as Omit<SystemSettings, 'adminPin'>;
    return NextResponse.json(
      { success: true, settings },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { gcashQrUrl, gcashAccountName, gcashNumber, courtOpenTime, courtCloseTime, adminPin } = body;

    const currentRes = await db.execute({ sql: 'SELECT * FROM settings WHERE id = ?', args: ['default'] });
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Settings not found' }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();

    await db.execute({
      sql: `UPDATE settings
            SET gcashQrUrl = COALESCE(?, gcashQrUrl),
                gcashAccountName = COALESCE(?, gcashAccountName),
                gcashNumber = COALESCE(?, gcashNumber),
                courtOpenTime = COALESCE(?, courtOpenTime),
                courtCloseTime = COALESCE(?, courtCloseTime),
                adminPin = COALESCE(?, adminPin),
                updatedAt = ?
            WHERE id = ?`,
      args: [
        gcashQrUrl !== undefined ? gcashQrUrl : null,
        gcashAccountName !== undefined ? gcashAccountName : null,
        gcashNumber !== undefined ? gcashNumber : null,
        courtOpenTime !== undefined ? courtOpenTime : null,
        courtCloseTime !== undefined ? courtCloseTime : null,
        adminPin ? adminPin : null,
        updatedAt,
        'default'
      ]
    });

    const updatedRes = await db.execute({
      sql: 'SELECT id, gcashQrUrl, gcashAccountName, gcashNumber, courtOpenTime, courtCloseTime, updatedAt FROM settings WHERE id = ?',
      args: ['default']
    });

    return NextResponse.json(
      { success: true, settings: updatedRes.rows[0] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
