/**
 * Seeds the admin_users table in Turso with the default admin user.
 * Run: node scripts/seed-admin-user.mjs
 */

import { createClient } from '@libsql/client';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const envPath = path.join(projectRoot, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^"|"$/g, '');
    process.env[key] = value;
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const defaultPassword = process.env.ADMIN_PASSWORD ?? 'Golois';
const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

await client.execute({
  sql: `INSERT OR IGNORE INTO admin_users (id, username, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  args: ['admin_seed_1', 'admin', 'webmaster@cmfimaryland.com', 'Golois Mouelet', passwordHash, new Date().toISOString()],
});

console.log('Done — admin user seeded in Turso:');
console.log('  username: admin');
console.log('  email:    webmaster@cmfimaryland.com');
console.log('  name:     Golois Mouelet');
console.log('  password: (from ADMIN_PASSWORD env var)');
