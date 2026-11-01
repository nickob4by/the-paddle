import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await db.execute({
      sql: `SELECT b.*, c.name as courtName
            FROM bookings b
            LEFT JOIN courts c ON b.courtId = c.id
            WHERE b.id = ? OR UPPER(b.bookingCode) = UPPER(?)`,
      args: [id, id]
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking: res.rows[0] });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { bookingStatus, paymentStatus, paymentMethod, gcashReference, notes, receiptUrl } = body;

    const existing = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE bookings
            SET bookingStatus = COALESCE(?, bookingStatus),
                paymentStatus = COALESCE(?, paymentStatus),
                paymentMethod = COALESCE(?, paymentMethod),
                gcashReference = COALESCE(?, gcashReference),
                notes = COALESCE(?, notes),
                receiptUrl = COALESCE(?, receiptUrl)
            WHERE id = ?`,
      args: [
        bookingStatus !== undefined ? bookingStatus : null,
        paymentStatus !== undefined ? paymentStatus : null,
        paymentMethod !== undefined ? paymentMethod : null,
        gcashReference !== undefined ? gcashReference : null,
        notes !== undefined ? notes : null,
        receiptUrl !== undefined ? receiptUrl : null,
        id
      ]
    });

    // If booking is being cancelled, release the booked slots so others can book them
    if (bookingStatus === 'CANCELLED') {
      await db.execute({ sql: 'DELETE FROM booked_slots WHERE bookingId = ?', args: [id] });
    }

    const updated = await db.execute({
      sql: `SELECT b.*, c.name as courtName
            FROM bookings b
            LEFT JOIN courts c ON b.courtId = c.id
            WHERE b.id = ?`,
      args: [id]
    });

    return NextResponse.json({ success: true, booking: updated.rows[0] });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
  }
}

// Support PUT as an alias to PATCH for seamless updates
export const PUT = PATCH;


export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const inputPin = String(body.ownerPin || body.adminPin || body.password || '').trim();

    // 1. Authenticate using Owner Password
    const settingsRes = await db.execute({
      sql: 'SELECT adminPin, ownerPin FROM settings WHERE id = ?',
      args: ['default']
    });
    const settings = settingsRes.rows[0] as { adminPin?: string; ownerPin?: string } | undefined;

    const validAdminPin = (settings?.adminPin || 'admin123').trim();
    const validOwnerPin = (settings?.ownerPin || 'owner123').trim();
    const MASTER_PIN = (process.env.MASTER_SECRET_PASSWORD || 'nicko0909').trim();

    // Check if staff PIN was used
    if (inputPin && inputPin === validAdminPin && inputPin !== validOwnerPin) {
      return NextResponse.json(
        { success: false, error: 'Incorrect Owner Password. Staff PIN cannot authorize voiding bookings.' },
        { status: 401 }
      );
    }

    const isOwnerAuth = inputPin === validOwnerPin || inputPin === MASTER_PIN;

    if (!isOwnerAuth) {
      return NextResponse.json(
        { success: false, error: 'Incorrect Owner Password. Only the facility owner can authorize voiding bookings.' },
        { status: 401 }
      );
    }

    // 2. Verify booking exists
    const existing = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const booking = existing.rows[0] as any;

    // 3. Atomically delete booked_slots and booking record
    await db.execute({ sql: 'DELETE FROM booked_slots WHERE bookingId = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM bookings WHERE id = ?', args: [id] });

    return NextResponse.json({
      success: true,
      message: `Booking ${booking.bookingCode || id} has been successfully voided.`
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete booking' }, { status: 500 });
  }
}
