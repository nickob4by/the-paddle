import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { SystemSettings } from '@/lib/types';

let schemaMigrated = false;
async function ensureSettingsSchema() {
  if (schemaMigrated) return;
  const columnsToAdd = [
    'ALTER TABLE settings ADD COLUMN openPlayEnabled INTEGER DEFAULT 1',
    'ALTER TABLE settings ADD COLUMN openPlayStartTime TEXT DEFAULT "05:00"',
    'ALTER TABLE settings ADD COLUMN openPlayEndTime TEXT DEFAULT "11:00"',
    'ALTER TABLE settings ADD COLUMN openPlayPrice REAL DEFAULT 130',
    'ALTER TABLE settings ADD COLUMN openPlayCapacity INTEGER DEFAULT 16',
    'ALTER TABLE settings ADD COLUMN openPlayCourtIds TEXT DEFAULT "all"',
    "ALTER TABLE settings ADD COLUMN openPlayDays TEXT DEFAULT '[\"MON\",\"TUE\",\"WED\",\"THU\",\"FRI\",\"SAT\",\"SUN\"]'",
    'ALTER TABLE settings ADD COLUMN noticeBannerEnabled INTEGER DEFAULT 0',
    "ALTER TABLE settings ADD COLUMN scheduledPriceChanges TEXT DEFAULT '[]'"
  ];

  for (const sql of columnsToAdd) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists or table altered
    }
  }
  schemaMigrated = true;
}

const SELECT_SETTINGS_COLS = `
  id, gcashQrUrl, gcashAccountName, gcashNumber,
  courtOpenTime, courtCloseTime, isBookingDisabled,
  closureReason, closureBannerText, closureStartDate, closureEndDate, closureStartTime, closureEndTime,
  openPlayEnabled, openPlayStartTime, openPlayEndTime, openPlayPrice, openPlayCapacity, openPlayCourtIds, openPlayDays,
  noticeBannerEnabled, scheduledPriceChanges,
  updatedAt
`;

export async function GET(request: Request) {
  try {
    await ensureSettingsSchema();

    const res = await db.execute({
      sql: `SELECT ${SELECT_SETTINGS_COLS} FROM settings WHERE id = ?`,
      args: ['default']
    });

    const rawSettings = (res.rows[0] || {}) as any;
    const settings: Omit<SystemSettings, 'adminPin'> = {
      ...rawSettings,
      openPlayEnabled: rawSettings.openPlayEnabled !== undefined && rawSettings.openPlayEnabled !== null ? Number(rawSettings.openPlayEnabled) : 1,
      openPlayStartTime: rawSettings.openPlayStartTime || '05:00',
      openPlayEndTime: rawSettings.openPlayEndTime || '11:00',
      openPlayPrice: rawSettings.openPlayPrice !== undefined && rawSettings.openPlayPrice !== null ? Number(rawSettings.openPlayPrice) : 130,
      openPlayCapacity: rawSettings.openPlayCapacity !== undefined && rawSettings.openPlayCapacity !== null ? Number(rawSettings.openPlayCapacity) : 16,
      openPlayCourtIds: rawSettings.openPlayCourtIds || 'all',
      openPlayDays: rawSettings.openPlayDays || '["MON","TUE","WED","THU","FRI","SAT","SUN"]',
      noticeBannerEnabled: rawSettings.noticeBannerEnabled !== undefined && rawSettings.noticeBannerEnabled !== null ? Number(rawSettings.noticeBannerEnabled) : 0,
      scheduledPriceChanges: rawSettings.scheduledPriceChanges || '[]'
    };

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
    await ensureSettingsSchema();

    const body = await request.json();
    const {
      gcashQrUrl,
      gcashAccountName,
      gcashNumber,
      courtOpenTime,
      courtCloseTime,
      adminPin,
      isBookingDisabled,
      closureReason,
      closureBannerText,
      closureStartDate,
      closureEndDate,
      closureStartTime,
      closureEndTime,
      openPlayEnabled,
      openPlayStartTime,
      openPlayEndTime,
      openPlayPrice,
      openPlayCapacity,
      openPlayCourtIds,
      openPlayDays,
      noticeBannerEnabled,
      scheduledPriceChanges
    } = body;

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
                isBookingDisabled = COALESCE(?, isBookingDisabled),
                closureReason = COALESCE(?, closureReason),
                closureBannerText = COALESCE(?, closureBannerText),
                closureStartDate = COALESCE(?, closureStartDate),
                closureEndDate = COALESCE(?, closureEndDate),
                closureStartTime = COALESCE(?, closureStartTime),
                closureEndTime = COALESCE(?, closureEndTime),
                openPlayEnabled = COALESCE(?, openPlayEnabled),
                openPlayStartTime = COALESCE(?, openPlayStartTime),
                openPlayEndTime = COALESCE(?, openPlayEndTime),
                openPlayPrice = COALESCE(?, openPlayPrice),
                openPlayCapacity = COALESCE(?, openPlayCapacity),
                openPlayCourtIds = COALESCE(?, openPlayCourtIds),
                openPlayDays = COALESCE(?, openPlayDays),
                noticeBannerEnabled = COALESCE(?, noticeBannerEnabled),
                scheduledPriceChanges = COALESCE(?, scheduledPriceChanges),
                updatedAt = ?
            WHERE id = ?`,
      args: [
        gcashQrUrl !== undefined ? gcashQrUrl : null,
        gcashAccountName !== undefined ? gcashAccountName : null,
        gcashNumber !== undefined ? gcashNumber : null,
        courtOpenTime !== undefined ? courtOpenTime : null,
        courtCloseTime !== undefined ? courtCloseTime : null,
        adminPin ? adminPin : null,
        isBookingDisabled !== undefined ? Number(isBookingDisabled) : null,
        closureReason !== undefined ? closureReason : null,
        closureBannerText !== undefined ? closureBannerText : null,
        closureStartDate !== undefined ? closureStartDate : null,
        closureEndDate !== undefined ? closureEndDate : null,
        closureStartTime !== undefined ? closureStartTime : null,
        closureEndTime !== undefined ? closureEndTime : null,
        openPlayEnabled !== undefined ? Number(openPlayEnabled) : null,
        openPlayStartTime !== undefined ? openPlayStartTime : null,
        openPlayEndTime !== undefined ? openPlayEndTime : null,
        openPlayPrice !== undefined ? Number(openPlayPrice) : null,
        openPlayCapacity !== undefined ? Number(openPlayCapacity) : null,
        openPlayCourtIds !== undefined ? openPlayCourtIds : null,
        openPlayDays !== undefined ? openPlayDays : null,
        noticeBannerEnabled !== undefined ? Number(noticeBannerEnabled) : null,
        scheduledPriceChanges !== undefined ? (typeof scheduledPriceChanges === 'string' ? scheduledPriceChanges : JSON.stringify(scheduledPriceChanges)) : null,
        updatedAt,
        'default'
      ]
    });

    const updatedRes = await db.execute({
      sql: `SELECT ${SELECT_SETTINGS_COLS} FROM settings WHERE id = ?`,
      args: ['default']
    });

    const rawSettings = (updatedRes.rows[0] || {}) as any;
    const settings: Omit<SystemSettings, 'adminPin'> = {
      ...rawSettings,
      openPlayEnabled: rawSettings.openPlayEnabled !== undefined && rawSettings.openPlayEnabled !== null ? Number(rawSettings.openPlayEnabled) : 1,
      openPlayStartTime: rawSettings.openPlayStartTime || '05:00',
      openPlayEndTime: rawPlaySettingsEndTime(rawSettings),
      openPlayPrice: rawSettings.openPlayPrice !== undefined && rawSettings.openPlayPrice !== null ? Number(rawSettings.openPlayPrice) : 130,
      openPlayCapacity: rawSettings.openPlayCapacity !== undefined && rawSettings.openPlayCapacity !== null ? Number(rawSettings.openPlayCapacity) : 16,
      openPlayCourtIds: rawSettings.openPlayCourtIds || 'all',
      openPlayDays: rawSettings.openPlayDays || '["MON","TUE","WED","THU","FRI","SAT","SUN"]',
      noticeBannerEnabled: rawSettings.noticeBannerEnabled !== undefined && rawSettings.noticeBannerEnabled !== null ? Number(rawSettings.noticeBannerEnabled) : 0,
      scheduledPriceChanges: rawSettings.scheduledPriceChanges || '[]'
    };

    function rawPlaySettingsEndTime(s: any) {
      return s.openPlayEndTime || '11:00';
    }

    return NextResponse.json(
      { success: true, settings },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
