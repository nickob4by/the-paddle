import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Booking, Court, getSlotRate } from '@/lib/types';
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

    // Require receipt upload for GCash bookings
    if (paymentMethod === 'GCASH' && (!receiptUrl || typeof receiptUrl !== 'string' || !receiptUrl.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please upload your GCash payment screenshot receipt to complete your booking.' },
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
      const openHour = 5; // Facility opening hour
      if (phHour >= openHour) {
        const slotOffset = (slotHour - openHour + 24) % 24;
        const currentOffset = (phHour - openHour + 24) % 24;
        if (slotOffset < currentOffset) {
          return NextResponse.json(
            { success: false, error: 'Cannot book time slots that have already passed.' },
            { status: 400 }
          );
        }
      }
    }

    // Check if facility-wide booking is disabled or in scheduled vacation/closure
    const settingsRes = await db.execute({
      sql: 'SELECT isBookingDisabled, closureReason, closureBannerText, closureStartDate, closureEndDate FROM settings WHERE id = ?',
      args: ['default']
    });
    if (settingsRes.rows.length > 0) {
      const s = settingsRes.rows[0] as any;
      const isGloballyDisabled = Number(s.isBookingDisabled) === 1;
      const isDateClosed = Boolean(
        (s.closureStartDate && s.closureEndDate && bookingDate >= s.closureStartDate && bookingDate <= s.closureEndDate) ||
        (s.closureStartDate && !s.closureEndDate && bookingDate === s.closureStartDate)
      );

      if (isGloballyDisabled || isDateClosed) {
        const notice = s.closureBannerText || s.closureReason || 'The facility is temporarily closed for vacation or maintenance.';
        return NextResponse.json(
          { success: false, error: `Bookings are currently unavailable: ${notice}` },
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

    if (court.isActive === 0) {
      return NextResponse.json(
        { success: false, error: `${court.name} is currently undergoing maintenance and is not accepting bookings.` },
        { status: 400 }
      );
    }

    // Calculate discrete hour slots and total amount based on time-range pricing
    const startHourInt = parseInt(startTime.split(':')[0], 10);
    let endHourInt = parseInt(endTime.split(':')[0], 10);
    if (endTime === '24:00') endHourInt = 24;

    const slotHours: string[] = [];
    let totalAmount = 0;

    if (startHourInt < endHourInt) {
      for (let h = startHourInt; h < endHourInt; h++) {
        const slotStr = `${h.toString().padStart(2, '0')}:00`;
        slotHours.push(slotStr);
        totalAmount += getSlotRate(court, slotStr);
      }
    } else {
      // Overnight booking crossing midnight (e.g. 23:00 to 02:00)
      for (let h = startHourInt; h < 24; h++) {
        const slotStr = `${h.toString().padStart(2, '0')}:00`;
        slotHours.push(slotStr);
        totalAmount += getSlotRate(court, slotStr);
      }
      for (let h = 0; h < endHourInt; h++) {
        const slotStr = `${h.toString().padStart(2, '0')}:00`;
        slotHours.push(slotStr);
        totalAmount += getSlotRate(court, slotStr);
      }
    }

    const durationHours = Math.max(slotHours.length, 1);
    if (totalAmount === 0 && durationHours > 0) {
      totalAmount = durationHours * Number(court.hourlyRate);
    }

    // Overlap / Collision Check using discrete hour slots
    if (slotHours.length > 0) {
      const placeholders = slotHours.map(() => '?').join(', ');
      const overlapping = await db.execute({
        sql: `SELECT bs.hourSlot, b.bookingCode FROM booked_slots bs
              JOIN bookings b ON bs.bookingId = b.id
              WHERE bs.courtId = ?
                AND bs.bookingDate = ?
                AND b.bookingStatus != 'CANCELLED'
                AND bs.hourSlot IN (${placeholders})`,
        args: [courtId, bookingDate, ...slotHours]
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
    }

    // Generate readable booking code: e.g. PAD-7492
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PAD-${randomDigits}`;
    const id = 'book-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    let bookingStatus = paymentMethod === 'GCASH' ? 'PENDING' : 'CONFIRMED';
    let paymentStatus = paymentMethod === 'GCASH' ? 'VERIFICATION_PENDING' : 'UNPAID';

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
