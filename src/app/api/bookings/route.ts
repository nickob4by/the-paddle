import { NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  Booking,
  Court,
  SystemSettings,
  getSlotRate,
  isHourInClosureRange,
  isOpenPlayActiveOnDate,
  isCourtParticipatingInOpenPlay,
  isHourInOpenPlayWindow
} from '@/lib/types';
import crypto from 'crypto';

let schemaMigrated = false;
async function ensureBookingsSchema() {
  if (schemaMigrated) return;
  try {
    await db.execute("ALTER TABLE bookings ADD COLUMN bookingType TEXT DEFAULT 'STANDARD'");
  } catch {
    // Column already exists or table altered
  }
  schemaMigrated = true;
}

export async function GET(request: Request) {
  try {
    await ensureBookingsSchema();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const courtId = searchParams.get('courtId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const type = searchParams.get('type');

    let query = `
      SELECT b.*, c.name as courtName
      FROM bookings b
      LEFT JOIN courts c ON b.courtId = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    // If both courtId and date are specified (e.g. from the client calendar slot picker),
    // include both private bookings for this court AND all open play bookings on that date
    // so the client can calculate live open play spot availability accurately.
    if (courtId && date) {
      query += ' AND b.bookingDate = ? AND (b.courtId = ? OR b.bookingType = ?)';
      params.push(date, courtId, 'OPEN_PLAY');
    } else {
      if (date) {
        query += ' AND b.bookingDate = ?';
        params.push(date);
      }
      if (courtId) {
        query += ' AND b.courtId = ?';
        params.push(courtId);
      }
    }

    if (type) {
      query += ' AND b.bookingType = ?';
      params.push(type);
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
    await ensureBookingsSchema();

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
      notes = '',
      bookingType = 'STANDARD'
    } = body;

    const isPass = bookingType === 'OPEN_PLAY';

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
    const phTime = new Date(nowUtc.getTime() + (8 * 60 + nowUtc.getTimezoneOffset()) * 60000);
    const phYear = phTime.getFullYear();
    const phMonth = String(phTime.getMonth() + 1).padStart(2, '0');
    const phDay = String(phTime.getDate()).padStart(2, '0');
    const phTodayStr = `${phYear}-${phMonth}-${phDay}`;
    const phHour = phTime.getHours();

    if (bookingDate < phTodayStr) {
      return NextResponse.json(
        { success: false, error: 'Cannot book for past dates.' },
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

    // Fetch system settings for closures and open play configuration
    const settingsRes = await db.execute({
      sql: `SELECT id, isBookingDisabled, closureReason, closureBannerText, closureStartDate, closureEndDate,
                   closureStartTime, closureEndTime, openPlayEnabled, openPlayStartTime, openPlayEndTime,
                   openPlayPrice, openPlayCapacity, openPlayCourtIds, openPlayDays
            FROM settings WHERE id = ?`,
      args: ['default']
    });

    const settings: SystemSettings = (settingsRes.rows[0] || {}) as any;

    // Check facility closures
    const isGloballyDisabled = Number(settings.isBookingDisabled) === 1;
    const isDateClosed = Boolean(
      (settings.closureStartDate && settings.closureEndDate && bookingDate >= settings.closureStartDate && bookingDate <= settings.closureEndDate) ||
      (settings.closureStartDate && !settings.closureEndDate && bookingDate === settings.closureStartDate)
    );

    if (isGloballyDisabled || isDateClosed) {
      const hasTimeWindow = Boolean(settings.closureStartTime && settings.closureEndTime && settings.closureStartTime !== settings.closureEndTime);
      let overlapsClosure = true;
      if (hasTimeWindow) {
        overlapsClosure = isHourInClosureRange(startTime, settings.closureStartTime, settings.closureEndTime);
      }
      if (overlapsClosure) {
        const notice = settings.closureBannerText || settings.closureReason || 'The facility is temporarily closed for maintenance or vacation.';
        return NextResponse.json({ success: false, error: `Bookings are unavailable for this time: ${notice}` }, { status: 400 });
      }
    }

    let finalTotalAmount = 0;
    let finalDurationHours = 1;
    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (isPass) {
      // ----------------------------------------------------
      // OPEN PLAY BOOKING LOGIC
      // ----------------------------------------------------
      if (!isOpenPlayActiveOnDate(bookingDate, settings)) {
        return NextResponse.json(
          { success: false, error: 'Morning Open Play is not active on the selected date.' },
          { status: 400 }
        );
      }

      if (!isCourtParticipatingInOpenPlay(courtId, settings)) {
        return NextResponse.json(
          { success: false, error: 'Selected court does not participate in Morning Open Play.' },
          { status: 400 }
        );
      }

      const capacity = Number(settings.openPlayCapacity || 16);
      const openPlayPrice = Number(settings.openPlayPrice !== undefined ? settings.openPlayPrice : 130);
      finalStartTime = settings.openPlayStartTime || '05:00';
      finalEndTime = settings.openPlayEndTime || '11:00';

      // Check current headcount
      const countRes = await db.execute({
        sql: `SELECT COUNT(*) as count FROM bookings
              WHERE bookingDate = ? AND bookingType = 'OPEN_PLAY' AND bookingStatus != 'CANCELLED'`,
        args: [bookingDate]
      });
      const currentHeadcount = Number(countRes.rows[0]?.count || 0);

      if (currentHeadcount >= capacity) {
        return NextResponse.json(
          {
            success: false,
            error: `The Morning Open Play session for ${bookingDate} is completely sold out (${capacity}/${capacity} spots taken).`
          },
          { status: 409 }
        );
      }

      finalTotalAmount = openPlayPrice;
      const startH = parseInt(finalStartTime.split(':')[0], 10);
      const endH = parseInt(finalEndTime.split(':')[0], 10);
      finalDurationHours = endH > startH ? endH - startH : 6;
    } else {
      // ----------------------------------------------------
      // STANDARD PRIVATE HOURLY BOOKING LOGIC
      // ----------------------------------------------------
      const isOpenPlayDay = isOpenPlayActiveOnDate(bookingDate, settings);
      const isCourtOpenPlay = isCourtParticipatingInOpenPlay(courtId, settings);

      const startHourInt = parseInt(startTime.split(':')[0], 10);
      let endHourInt = parseInt(endTime.split(':')[0], 10);
      if (endTime === '24:00') endHourInt = 24;

      const slotHours: string[] = [];
      if (startHourInt < endHourInt) {
        for (let h = startHourInt; h < endHourInt; h++) {
          slotHours.push(`${h.toString().padStart(2, '0')}:00`);
        }
      } else {
        for (let h = startHourInt; h < 24; h++) {
          slotHours.push(`${h.toString().padStart(2, '0')}:00`);
        }
        for (let h = 0; h < endHourInt; h++) {
          slotHours.push(`${h.toString().padStart(2, '0')}:00`);
        }
      }

      // Check if standard booking collides with Morning Open Play hours on participating court
      if (isOpenPlayDay && isCourtOpenPlay) {
        const collidesWithOpenPlay = slotHours.some((slot) => isHourInOpenPlayWindow(slot, settings));
        if (collidesWithOpenPlay) {
          const openStart = settings.openPlayStartTime || '05:00';
          const openEnd = settings.openPlayEndTime || '11:00';
          return NextResponse.json(
            {
              success: false,
              error: `This court is reserved for Morning Open Play (${openStart} - ${openEnd}). Private reservations are not available during these hours. Please book an Open Play Pass or choose a private slot from ${openEnd} onwards.`
            },
            { status: 400 }
          );
        }
      }

      // Calculate total amount based on time-range pricing
      let calcAmount = 0;
      for (const slotStr of slotHours) {
        calcAmount += getSlotRate(court, slotStr);
      }
      finalDurationHours = Math.max(slotHours.length, 1);
      finalTotalAmount = calcAmount > 0 ? calcAmount : finalDurationHours * Number(court.hourlyRate);

      // Overlap / Collision Check against booked_slots
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
    }

    // Generate readable booking code: e.g. PAD-7492
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `PAD-${randomDigits}`;
    const id = 'book-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    let bookingStatus = paymentMethod === 'GCASH' ? 'PENDING' : 'CONFIRMED';
    let paymentStatus = paymentMethod === 'GCASH' ? 'VERIFICATION_PENDING' : 'UNPAID';

    const batchStatements: Array<{ sql: string; args: any[] }> = [
      {
        sql: `INSERT INTO bookings (
                id, bookingCode, courtId, clientName, clientEmail, clientPhone,
                bookingDate, startTime, endTime, durationHours, totalAmount,
                paymentMethod, paymentStatus, bookingStatus, gcashReference,
                receiptUrl, notes, bookingType, createdAt
              ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
              )`,
        args: [
          id,
          bookingCode,
          courtId,
          clientName.trim(),
          (clientEmail || '').trim(),
          clientPhone.trim(),
          bookingDate,
          finalStartTime,
          finalEndTime,
          finalDurationHours,
          finalTotalAmount,
          paymentMethod,
          paymentStatus,
          bookingStatus,
          gcashReference.trim(),
          receiptUrl,
          notes.trim(),
          isPass ? 'OPEN_PLAY' : 'STANDARD',
          createdAt
        ]
      }
    ];

    // CRITICAL: Only insert individual discrete hour slots into booked_slots for STANDARD private reservations!
    // Open Play passes DO NOT insert into booked_slots to prevent UNIQUE constraint failure when multiple players book.
    if (!isPass) {
      const startHourInt = parseInt(startTime.split(':')[0], 10);
      let endHourInt = parseInt(endTime.split(':')[0], 10);
      if (endTime === '24:00') endHourInt = 24;

      const slotHours: string[] = [];
      if (startHourInt < endHourInt) {
        for (let h = startHourInt; h < endHourInt; h++) {
          slotHours.push(`${h.toString().padStart(2, '0')}:00`);
        }
      } else {
        for (let h = startHourInt; h < 24; h++) {
          slotHours.push(`${h.toString().padStart(2, '0')}:00`);
        }
        for (let h = 0; h < endHourInt; h++) {
          slotHours.push(`${h.toString().padStart(2, '0')}:00`);
        }
      }

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
      message: isPass ? 'Morning Open Play pass booked successfully!' : 'Court booking created successfully!',
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
