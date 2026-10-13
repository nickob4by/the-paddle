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
    const { bookingStatus, paymentStatus, gcashReference, notes } = body;

    const existing = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE bookings
            SET bookingStatus = COALESCE(?, bookingStatus),
                paymentStatus = COALESCE(?, paymentStatus),
                gcashReference = COALESCE(?, gcashReference),
                notes = COALESCE(?, notes)
            WHERE id = ?`,
      args: [
        bookingStatus !== undefined ? bookingStatus : null,
        paymentStatus !== undefined ? paymentStatus : null,
        gcashReference !== undefined ? gcashReference : null,
        notes !== undefined ? notes : null,
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

    const existing = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    await db.execute({ sql: 'DELETE FROM booked_slots WHERE bookingId = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM bookings WHERE id = ?', args: [id] });

    return NextResponse.json({ success: true, message: 'Booking removed successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete booking' }, { status: 500 });
  }
}
