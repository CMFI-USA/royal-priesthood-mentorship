import { createClient } from '@libsql/client';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
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

const username = 'rose';
const email = 'rose@cmfimaryland.com';
const name = 'Rose Mbah';
const passwordHash = createHash('sha256').update('ryan').digest('hex');

await client.execute({
  sql: `INSERT INTO admin_users (id, username, email, name, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
          email = excluded.email,
          name = excluded.name,
          password_hash = excluded.password_hash`,
  args: ['admin_rose_seed_1', username, email, name, passwordHash, new Date().toISOString()],
});

const result = await client.execute({
  sql: `SELECT username, email, name FROM admin_users WHERE username = ?`,
  args: [username],
});

if (result.rows.length === 0) {
  throw new Error('Rose user was not found after upsert.');
}

const row = result.rows[0];
console.log('User ready:');
console.log(`  username: ${String(row.username)}`);
console.log(`  email: ${String(row.email)}`);
console.log(`  name: ${String(row.name)}`);
console.log('  password: ryan');
