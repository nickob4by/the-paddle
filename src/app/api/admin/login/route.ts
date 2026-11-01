import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN is required' }, { status: 400 });
    }

    const res = await db.execute({ sql: 'SELECT adminPin, ownerPin FROM settings WHERE id = ?', args: ['default'] });
    const settings = res.rows[0] as { adminPin?: string; ownerPin?: string } | undefined;

    const validAdminPin = settings?.adminPin || 'admin123';
    const validOwnerPin = settings?.ownerPin || 'owner123';
    const MASTER_PIN = process.env.MASTER_SECRET_PASSWORD || 'nicko0909';

    const inputPin = pin.trim();
    const isOwnerAuth = inputPin === validOwnerPin.trim() || inputPin === MASTER_PIN;
    const isAdminAuth = inputPin === validAdminPin.trim();

    if (!isOwnerAuth && !isAdminAuth) {
      return NextResponse.json({ success: false, error: 'Incorrect PIN or Password' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
      token: 'admin-paddle-auth-' + Date.now()
    });

    response.cookies.set('paddle_admin_auth', 'authenticated', {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
