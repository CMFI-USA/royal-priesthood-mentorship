/**
 * One-time migration script: SQLite → Turso
 * Run with: node scripts/migrate-to-turso.mjs
 */

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Load .env.local manually
const envPath = path.join(projectRoot, '.env.local');
if (!existsSync(envPath)) {
  console.error('ERROR: .env.local not found at', envPath);
  process.exit(1);
}

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim().replace(/^"|"$/g, '');
  process.env[key] = value;
}

// Locate SQLite file
const sqlitePath = path.join(projectRoot, 'data', 'admin.sqlite');
if (!existsSync(sqlitePath)) {
  console.error('ERROR: SQLite database not found at', sqlitePath);
  process.exit(1);
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  console.error('ERROR: TURSO_DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('Opening SQLite database:', sqlitePath);
const sqlite = new Database(sqlitePath, { readonly: true });

console.log('Connecting to Turso:', tursoUrl);
const turso = createClient({ url: tursoUrl, authToken: tursoToken });

// Ensure tables exist in Turso
await turso.executeMultiple(`
  CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS message_history (
    id TEXT PRIMARY KEY,
    date_sent TEXT NOT NULL,
    author TEXT NOT NULL,
    message TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone_number TEXT NOT NULL,
    recipient_type TEXT NOT NULL,
    status TEXT NOT NULL,
    twilio_sid TEXT,
    error TEXT
  );
`);

// Migrate people
const people = sqlite.prepare('SELECT * FROM people ORDER BY created_at ASC').all();
console.log(`\nMigrating ${people.length} people...`);

let peopleInserted = 0;
let peopleSkipped = 0;

for (const row of people) {
  try {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO people (id, name, phone_number, type, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [row.id, row.name, row.phone_number, row.type, row.created_at],
    });
    const existing = await turso.execute({ sql: `SELECT id FROM people WHERE id = ?`, args: [row.id] });
    if (existing.rows.length > 0) {
      console.log(`  ✓ ${row.name} (${row.type})`);
      peopleInserted++;
    } else {
      console.log(`  - skipped: ${row.name}`);
      peopleSkipped++;
    }
  } catch (err) {
    console.warn(`  ! Failed to insert ${row.name}: ${err.message}`);
    peopleSkipped++;
  }
}

// Migrate message history
const messages = sqlite.prepare('SELECT * FROM message_history ORDER BY date_sent ASC').all();
console.log(`\nMigrating ${messages.length} message history entries...`);

let messagesInserted = 0;
let messagesSkipped = 0;

for (const row of messages) {
  try {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO message_history (id, date_sent, author, message, recipient_id, recipient_name, recipient_phone_number, recipient_type, status, twilio_sid, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [row.id, row.date_sent, row.author, row.message, row.recipient_id, row.recipient_name, row.recipient_phone_number, row.recipient_type, row.status, row.twilio_sid ?? null, row.error ?? null],
    });
    messagesInserted++;
    console.log(`  ✓ [${row.date_sent.slice(0, 10)}] to ${row.recipient_name}: ${row.message.slice(0, 40)}...`);
  } catch (err) {
    console.warn(`  ! Failed to insert message ${row.id}: ${err.message}`);
    messagesSkipped++;
  }
}

sqlite.close();

console.log(`
Migration complete!
  People:   ${peopleInserted} migrated, ${peopleSkipped} skipped
  Messages: ${messagesInserted} migrated, ${messagesSkipped} skipped
`);
