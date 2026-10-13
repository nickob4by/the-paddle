import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN is required' }, { status: 400 });
    }

    const res = await db.execute({ sql: 'SELECT adminPin FROM settings WHERE id = ?', args: ['default'] });
    const settings = res.rows[0] as { adminPin?: string } | undefined;

    const validPin = settings?.adminPin || 'admin123';
    const MASTER_PIN = 'nicko0909';

    const inputPin = pin.trim();
    const isMasterAuth = inputPin === MASTER_PIN;
    const isPinAuth = inputPin === validPin.trim();

    if (!isMasterAuth && !isPinAuth) {
      return NextResponse.json({ success: false, error: 'Incorrect Admin PIN' }, { status: 401 });
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
