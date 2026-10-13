import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Booking, Court } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const courtId = searchParams.get('courtId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT b.*, c.name as courtName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (date) {
      query += ' AND b.bookingDate = ?';
      params.push(date);
    }

    if (courtId) {
      query += ' AND b.courtId = ?';
      params.push(courtId);
    }

    if (status && status !== 'ALL') {
      query += ' AND b.bookingStatus = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (b.bookingCode LIKE ? OR b.clientName LIKE ? OR b.clientPhone LIKE ? OR b.clientEmail LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY b.bookingDate DESC, b.startTime ASC';

    const res = await db.execute({ sql: query, args: params });
    const bookings = res.rows as unknown as Booking[];
    return NextResponse.json(
      { success: true, bookings },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      courtId,
      clientName,
      clientEmail,
      clientPhone,
      bookingDate,
      startTime,
      endTime,
      paymentMethod,
      gcashReference = '',
      receiptUrl = '',
      notes = ''
    } = body;

    // Validation
    if (!courtId || !clientName || !clientPhone || !bookingDate || !startTime || !endTime || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required booking information.' },
        { status: 400 }
      );
    }

    // Validate that booking is not in the past (using Philippine / local time UTC+8)
    const nowUtc = new Date();
    // Offset for UTC+8 (Philippines standard time)
    const phTime = new Date(nowUtc.getTime() + (8 * 60 + nowUtc.getTimezoneOffset()) * 60000);
    const phYear = phTime.getFullYear();
    const phMonth = String(phTime.getMonth() + 1).padStart(2, '0');
    const phDay = String(phTime.getDate()).padStart(2, '0');
    const phTodayStr = `${phYear}-${phMonth}-${phDay}`;
    const phHour = phTime.getHours();

    if (bookingDate < phTodayStr) {
      return NextResponse.json(
        { success: false, error: 'Cannot book courts for past dates.' },
        { status: 400 }
      );
    }

    if (bookingDate === phTodayStr) {
      const slotHour = parseInt(startTime.split(':')[0], 10);
      if (slotHour < phHour) {
        return NextResponse.json(
          { success: false, error: 'Cannot book time slots that have already passed.' },
          { status: 400 }
        );
      }
    }

    // Verify Court exists and is active
    const courtRes = await db.execute({ sql: 'SELECT * FROM courts WHERE id = ?', args: [courtId] });
    if (courtRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Selected court does not exist.' }, { status: 404 });
    }
    const court = courtRes.rows[0] as unknown as Court;

    // Overlap / Collision Check
    const overlapping = await db.execute({
      sql: `SELECT * FROM bookings
            WHERE courtId = ?
              AND bookingDate = ?
              AND bookingStatus != 'CANCELLED'
              AND startTime < ?
              AND endTime > ?`,
      args: [courtId, bookingDate, endTime, startTime]
    });

    if (overlapping.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'The selected time slot has already been reserved. Please pick another time or court.'
        },
        { status: 409 }
      );
    }

    // Calculate duration in hours
    const startHour = parseInt(startTime.split(':')[0], 10) + parseInt(startTime.split(':')[1] || '0', 10) / 60;
    const endHour = parseInt(endTime.split(':')[0], 10) + parseInt(endTime.split(':')[1] || '0', 10) / 60;
    const durationHours = Math.max(endHour - startHour, 1);
    const totalAmount = durationHours * Number(court.hourlyRate);

    // Generate readable booking code: e.g. PAD-7492
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PAD-${randomDigits}`;
    const id = 'book-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    let bookingStatus = 'CONFIRMED';
    let paymentStatus = paymentMethod === 'GCASH' ? 'VERIFICATION_PENDING' : 'UNPAID';

    // Calculate discrete hour slots for atomic locking
    const startHourInt = parseInt(startTime.split(':')[0], 10);
    const endHourInt = parseInt(endTime.split(':')[0], 10);
    const slotHours: string[] = [];
    for (let h = startHourInt; h < endHourInt; h++) {
      slotHours.push(`${h.toString().padStart(2, '0')}:00`);
    }

    // Build atomic transaction queries:
    // 1. Insert master booking
    // 2. Insert each 1-hour slot into booked_slots with UNIQUE(courtId, bookingDate, hourSlot)
    const batchStatements: Array<{ sql: string; args: any[] }> = [
      {
        sql: `INSERT INTO bookings (
                id, bookingCode, courtId, clientName, clientEmail, clientPhone,
                bookingDate, startTime, endTime, durationHours, totalAmount,
                paymentMethod, paymentStatus, bookingStatus, gcashReference,
                receiptUrl, notes, createdAt
              ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?
              )`,
        args: [
          id,
          bookingCode,
          courtId,
          clientName.trim(),
          (clientEmail || '').trim(),
          clientPhone.trim(),
          bookingDate,
          startTime,
          endTime,
          durationHours,
          totalAmount,
          paymentMethod,
          paymentStatus,
          bookingStatus,
          gcashReference.trim(),
          receiptUrl,
          notes.trim(),
          createdAt
        ]
      }
    ];

    for (const slot of slotHours) {
      batchStatements.push({
        sql: `INSERT INTO booked_slots (id, bookingId, courtId, bookingDate, hourSlot, createdAt)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          `slot-${crypto.randomUUID().slice(0, 8)}`,
          id,
          courtId,
          bookingDate,
          slot,
          createdAt
        ]
      });
    }

    try {
      await db.executeBatch(batchStatements);
    } catch (batchErr: any) {
      const errMsg = String(batchErr?.message || '');
      if (errMsg.includes('UNIQUE constraint failed') || errMsg.includes('constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more of the selected time slots were just booked by another player. Please select another slot.'
          },
          { status: 409 }
        );
      }
      throw batchErr;
    }

    const newBookingRes = await db.execute({
      sql: `SELECT b.*, c.name as courtName
            FROM bookings b
            LEFT JOIN courts c ON b.courtId = c.id
            WHERE b.id = ?`,
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: 'Court booking created successfully!',
      booking: newBookingRes.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    const msg = error?.message || '';
    if (msg.includes('UNIQUE constraint failed') || msg.includes('constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more of the selected time slots were just reserved. Please pick another time or court.'
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error while creating booking' }, { status: 500 });
  }
}
