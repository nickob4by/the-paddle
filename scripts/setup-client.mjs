#!/usr/bin/env node

/**
 * 🏓 Court Booking System - Client Tenant Setup Wizard
 * 
 * Usage:
 *   Interactive mode: npm run setup:client
 *   Config file mode: npm run setup:client -- --config client.json
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(msg = '') {
  console.log(msg);
}

function success(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`);
}

function warn(msg) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}✖ ${msg}${colors.reset}`);
}

// Turso query helper via native HTTP pipeline
async function executeTurso(tursoUrl, authToken, statements) {
  const httpUrl = tursoUrl.replace(/^libsql:\/\//, 'https://');
  const requests = statements.map((stmt) => {
    const sql = typeof stmt === 'string' ? stmt : stmt.sql;
    const rawArgs = typeof stmt === 'string' ? [] : (stmt.args || []);
    const formattedArgs = rawArgs.map((arg) => {
      if (arg === null || arg === undefined) return { type: 'null' };
      if (typeof arg === 'number') {
        return Number.isInteger(arg) ? { type: 'integer', value: String(arg) } : { type: 'float', value: arg };
      }
      if (typeof arg === 'boolean') {
        return { type: 'integer', value: arg ? '1' : '0' };
      }
      return { type: 'text', value: String(arg) };
    });
    return {
      type: 'execute',
      stmt: { sql, args: formattedArgs }
    };
  });

  requests.push({ type: 'close' });

  const res = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP Error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.results;
}

// Database Schema DDL
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS courts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    surfaceType TEXT,
    hourlyRate REAL NOT NULL,
    isActive INTEGER DEFAULT 1,
    imageUrl TEXT,
    createdAt TEXT NOT NULL,
    pricingRules TEXT DEFAULT "[]"
  );`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    bookingCode TEXT UNIQUE NOT NULL,
    courtId TEXT NOT NULL,
    clientName TEXT NOT NULL,
    clientEmail TEXT NOT NULL,
    clientPhone TEXT NOT NULL,
    bookingDate TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    durationHours REAL NOT NULL,
    totalAmount REAL NOT NULL,
    paymentMethod TEXT NOT NULL,
    paymentStatus TEXT NOT NULL,
    bookingStatus TEXT NOT NULL,
    gcashReference TEXT,
    receiptUrl TEXT,
    notes TEXT,
    bookingType TEXT DEFAULT "STANDARD",
    createdAt TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    gcashQrUrl TEXT,
    gcashAccountName TEXT NOT NULL,
    gcashNumber TEXT NOT NULL,
    courtOpenTime TEXT NOT NULL,
    courtCloseTime TEXT NOT NULL,
    adminPin TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    isBookingDisabled INTEGER DEFAULT 0,
    closureReason TEXT DEFAULT "",
    closureBannerText TEXT DEFAULT "",
    closureStartDate TEXT DEFAULT "",
    closureEndDate TEXT DEFAULT "",
    closureStartTime TEXT DEFAULT "",
    closureEndTime TEXT DEFAULT "",
    openPlayEnabled INTEGER DEFAULT 1,
    openPlayStartTime TEXT DEFAULT "05:00",
    openPlayEndTime TEXT DEFAULT "11:00",
    openPlayPrice REAL DEFAULT 130,
    openPlayCapacity INTEGER DEFAULT 16,
    openPlayCourtIds TEXT DEFAULT "all",
    openPlayDays TEXT DEFAULT "[\"MON\",\"TUE\",\"WED\",\"THU\",\"FRI\",\"SAT\",\"SUN\"]",
    noticeBannerEnabled INTEGER DEFAULT 0,
    scheduledPriceChanges TEXT DEFAULT '[]'
  );`,

  `CREATE TABLE IF NOT EXISTS booked_slots (
    id TEXT PRIMARY KEY,
    bookingId TEXT NOT NULL,
    courtId TEXT NOT NULL,
    bookingDate TEXT NOT NULL,
    hourSlot TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    UNIQUE(courtId, bookingDate, hourSlot)
  );`,

  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    costPrice REAL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    lowStockThreshold INTEGER DEFAULT 5,
    imageUrl TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS pos_orders (
    id TEXT PRIMARY KEY,
    orderNumber TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    paymentMethod TEXT NOT NULL,
    cashTendered REAL,
    changeGiven REAL,
    gcashReference TEXT,
    bookingId TEXT,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS pos_order_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    productName TEXT NOT NULL,
    unitPrice REAL NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal REAL NOT NULL
  );`
];

async function main() {
  log(`\n${colors.bold}${colors.magenta}====================================================${colors.reset}`);
  log(`${colors.bold}${colors.cyan}  🏓 COURT BOOKING TEMPLATE - CLIENT SETUP WIZARD   ${colors.reset}`);
  log(`${colors.bold}${colors.magenta}====================================================${colors.reset}\n`);

  let config = null;

  // Check if --config flag is passed
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && args[configIndex + 1]) {
    const configPath = path.resolve(process.cwd(), args[configIndex + 1]);
    if (!fs.existsSync(configPath)) {
      error(`Config file not found: ${configPath}`);
      process.exit(1);
    }
    info(`Loading configuration from ${configPath}`);
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // Interactive Prompts if no config provided
  if (!config) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = async (promptText, defaultValue) => {
      const fullPrompt = defaultValue !== undefined
        ? `${colors.bold}${promptText}${colors.reset} [default: ${colors.yellow}${defaultValue}${colors.reset}]: `
        : `${colors.bold}${promptText}${colors.reset}: `;
      const answer = await rl.question(fullPrompt);
      return answer.trim() || defaultValue;
    };

    config = {};

    log(`${colors.bold}1. Brand & Business Identity:${colors.reset}`);
    config.brandName = await ask('Court / Club Facility Name', 'The Paddle');
    config.brandTagline = await ask('Brand Tagline', 'Recreational Hub & Pickleball Club');
    config.contactPhone = await ask('Contact Phone / GCash Mobile', '0917-888-PADL');

    log(`\n${colors.bold}2. Turso Database Credentials:${colors.reset}`);
    log(`${colors.cyan}(Create a new database at https://turso.tech or via \`turso db create <client-name>\`)${colors.reset}`);
    config.tursoDatabaseUrl = await ask('Turso Database URL (e.g. libsql://client-db.turso.io)');
    config.tursoAuthToken = await ask('Turso Database Auth Token');

    if (!config.tursoDatabaseUrl || !config.tursoAuthToken) {
      error('Turso Database URL and Auth Token are required to initialize the database.');
      rl.close();
      process.exit(1);
    }

    log(`\n${colors.bold}3. Operating Hours & Admin Security:${colors.reset}`);
    config.courtOpenTime = await ask('Opening Hour (HH:00 24h format)', '05:00');
    config.courtCloseTime = await ask('Closing Hour (HH:00 24h format)', '03:00');
    config.adminPin = await ask('Admin Passcode / PIN', 'admin123');

    log(`\n${colors.bold}4. Court Setup & Rates:${colors.reset}`);
    const courtCountStr = await ask('Number of initial courts to create', '2');
    const courtCount = parseInt(courtCountStr, 10) || 2;
    const defaultDayRateStr = await ask('Standard Daytime Hourly Rate (₱)', '350');
    const defaultDayRate = parseFloat(defaultDayRateStr) || 350;
    const defaultNightRateStr = await ask('Evening Hourly Rate (₱)', '500');
    const defaultNightRate = parseFloat(defaultNightRateStr) || 500;
    const eveningStartTime = await ask('Evening Rate Start Time (24h format)', '17:00');

    config.courts = [];
    for (let i = 1; i <= courtCount; i++) {
      config.courts.push({
        id: `court-${i}`,
        name: `Court ${i}`,
        description: `Tournament-grade indoor pickleball court ${i}`,
        surfaceType: 'Pro Cushion Acrylic',
        hourlyRate: defaultDayRate,
        pricingRules: [
          {
            id: `rule-evening-${i}`,
            label: 'Evening Rate',
            startTime: eveningStartTime,
            endTime: config.courtCloseTime,
            rate: defaultNightRate,
          }
        ]
      });
    }

    log(`\n${colors.bold}5. GCash Payment Details:${colors.reset}`);
    config.gcashAccountName = await ask('GCash Account Name', config.brandName);
    config.gcashNumber = await ask('GCash Number', config.contactPhone);
    config.gcashQrUrl = await ask('GCash QR Code Image URL (optional)', '');

    rl.close();
  }

  // --- EXECUTION PHASE ---
  log(`\n${colors.bold}${colors.cyan}--- Connecting & Initializing Database ---${colors.reset}`);
  info(`Target Database: ${config.tursoDatabaseUrl}`);

  try {
    // 1. Verify connection & run schema
    info('Applying schema tables (courts, bookings, settings, slots, products, orders)...');
    await executeTurso(config.tursoDatabaseUrl, config.tursoAuthToken, SCHEMA_STATEMENTS);
    success('Database schema applied successfully!');

    // 2. Initialize or Update Settings
    info('Setting up facility settings & admin PIN...');
    const nowIso = new Date().toISOString();
    const settingsSql = `
      INSERT INTO settings (
        id, gcashQrUrl, gcashAccountName, gcashNumber, courtOpenTime, courtCloseTime,
        adminPin, updatedAt, isBookingDisabled, closureReason, closureBannerText,
        closureStartDate, closureEndDate, closureStartTime, closureEndTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '', '', '', '', '', '')
      ON CONFLICT(id) DO UPDATE SET
        gcashAccountName = excluded.gcashAccountName,
        gcashNumber = excluded.gcashNumber,
        gcashQrUrl = excluded.gcashQrUrl,
        courtOpenTime = excluded.courtOpenTime,
        courtCloseTime = excluded.courtCloseTime,
        adminPin = excluded.adminPin,
        updatedAt = excluded.updatedAt;
    `;

    await executeTurso(config.tursoDatabaseUrl, config.tursoAuthToken, [{
      sql: settingsSql,
      args: [
        'default',
        config.gcashQrUrl || '',
        config.gcashAccountName || config.brandName,
        config.gcashNumber || config.contactPhone,
        config.courtOpenTime || '05:00',
        config.courtCloseTime || '03:00',
        config.adminPin || 'admin123',
        nowIso
      ]
    }]);
    success('Facility settings saved!');

    // 3. Seed Courts
    if (config.courts && config.courts.length > 0) {
      info(`Seeding ${config.courts.length} court(s)...`);
      for (const court of config.courts) {
        const courtId = court.id || `court-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const pricingRulesJson = JSON.stringify(court.pricingRules || []);
        const courtSql = `
          INSERT INTO courts (id, name, description, surfaceType, hourlyRate, isActive, imageUrl, createdAt, pricingRules)
          VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            surfaceType = excluded.surfaceType,
            hourlyRate = excluded.hourlyRate,
            pricingRules = excluded.pricingRules;
        `;
        await executeTurso(config.tursoDatabaseUrl, config.tursoAuthToken, [{
          sql: courtSql,
          args: [
            courtId,
            court.name,
            court.description || 'Tournament-grade court',
            court.surfaceType || 'Pro Cushion Acrylic',
            court.hourlyRate || 350,
            court.imageUrl || '',
            nowIso,
            pricingRulesJson
          ]
        }]);
      }
      success(`Seeded ${config.courts.length} court(s) with rate tiers!`);
    }

    // 4. Update .env.local
    info('Writing configuration to .env.local...');
    const envContent = `# Auto-generated by Court Booking Setup Wizard on ${new Date().toISOString()}
TURSO_DATABASE_URL="${config.tursoDatabaseUrl}"
TURSO_AUTH_TOKEN="${config.tursoAuthToken}"

# Brand Customization
NEXT_PUBLIC_BRAND_NAME="${config.brandName}"
NEXT_PUBLIC_BRAND_TAGLINE="${config.brandTagline || 'Recreational Hub & Pickleball Club'}"
NEXT_PUBLIC_ADDRESS="${config.address || 'Purok 20, Cambanogoy, Asuncion, Davao Del Norte'}"
NEXT_PUBLIC_CONTACT_PHONE="${config.contactPhone || ''}"
NEXT_PUBLIC_DEFAULT_OPEN_TIME="${config.courtOpenTime || '05:00'}"
NEXT_PUBLIC_DEFAULT_CLOSE_TIME="${config.courtCloseTime || '03:00'}"
NEXT_PUBLIC_LOGO_LIGHT="${config.logoLight || '/the-paddle-logo-light.png'}"
NEXT_PUBLIC_LOGO_DARK="${config.logoDark || '/the-paddle-logo-dark.png'}"
`;

    fs.writeFileSync(path.join(rootDir, '.env.local'), envContent, 'utf-8');
    success('.env.local created & updated!');

    // 5. Save client configuration snapshot
    const clientConfigPath = path.join(rootDir, 'client.config.json');
    fs.writeFileSync(clientConfigPath, JSON.stringify(config, null, 2), 'utf-8');
    success('Saved configuration snapshot to client.config.json');

    // 6. Complete
    log(`\n${colors.bold}${colors.green}====================================================${colors.reset}`);
    log(`${colors.bold}${colors.green}   🎉 SETUP COMPLETE! CLIENT SYSTEM IS READY!       ${colors.reset}`);
    log(`${colors.bold}${colors.green}====================================================${colors.reset}\n`);

    log(`${colors.bold}Client Summary:${colors.reset}`);
    log(`• Brand Name:      ${colors.cyan}${config.brandName}${colors.reset}`);
    log(`• Operating Hours: ${colors.cyan}${config.courtOpenTime} – ${config.courtCloseTime}${colors.reset}`);
    log(`• Admin PIN:       ${colors.cyan}${config.adminPin}${colors.reset}`);
    log(`• GCash Account:   ${colors.cyan}${config.gcashAccountName} (${config.gcashNumber})${colors.reset}`);
    log(`• Courts Seeded:   ${colors.cyan}${config.courts?.length || 0} courts${colors.reset}`);

    log(`\n${colors.bold}${colors.yellow}Render Environment Variables to set in Render Dashboard:${colors.reset}`);
    log(`----------------------------------------------------`);
    log(`TURSO_DATABASE_URL=${config.tursoDatabaseUrl}`);
    log(`TURSO_AUTH_TOKEN=${config.tursoAuthToken}`);
    log(`NEXT_PUBLIC_BRAND_NAME=${config.brandName}`);
    log(`NEXT_PUBLIC_BRAND_TAGLINE=${config.brandTagline || ''}`);
    log(`NEXT_PUBLIC_CONTACT_PHONE=${config.contactPhone || ''}`);
    log(`NEXT_PUBLIC_DEFAULT_OPEN_TIME=${config.courtOpenTime || '05:00'}`);
    log(`NEXT_PUBLIC_DEFAULT_CLOSE_TIME=${config.courtCloseTime || '03:00'}`);
    log(`----------------------------------------------------\n`);

    log(`To test locally, simply run:`);
    log(`  ${colors.bold}${colors.cyan}npm run dev${colors.reset}\n`);

  } catch (err) {
    error(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

main();
