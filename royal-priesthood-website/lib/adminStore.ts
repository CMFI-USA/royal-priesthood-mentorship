import { createClient } from '@libsql/client';
import { createHash } from 'crypto';
import { AdminUser, MessageHistoryEntry, Person, PersonType, RecipientMode } from '@/lib/adminTypes';

type AdminGlobal = typeof globalThis & {
  __royalPriesthoodTursoClient?: ReturnType<typeof createClient>;
  __royalPriesthoodTursoInitialized?: boolean;
};

const INITIAL_PEOPLE_SEED: Array<{
  name: string;
  phoneNumber: string;
  type: PersonType;
}> = [
  { name: 'Pastor Daniel Bullock', phoneNumber: '+13017687866', type: 'mentor' },
  { name: 'Mike Baker', phoneNumber: '+13018300618', type: 'mentor' },
  { name: 'Pastor Dartania Bullock', phoneNumber: '+14107107700', type: 'mentor' },
  { name: 'Rayhan Mbah', phoneNumber: '+12407880932', type: 'mentee' },
  { name: 'Ekene Onyechi', phoneNumber: '+13013352755', type: 'mentee' },
  { name: 'Ellice Mbah', phoneNumber: '+12407880931', type: 'mentee' },
  { name: 'Annelie Mbah', phoneNumber: '+16677559654', type: 'mentee' },
  { name: 'Ike Onyechi', phoneNumber: '+12404015505', type: 'mentee' },
];

function getClient(): ReturnType<typeof createClient> {
  const adminGlobal = globalThis as AdminGlobal;

  if (!adminGlobal.__royalPriesthoodTursoClient) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) throw new Error('TURSO_DATABASE_URL environment variable is not set.');

    adminGlobal.__royalPriesthoodTursoClient = createClient({ url, authToken });
  }

  return adminGlobal.__royalPriesthoodTursoClient;
}

async function ensureInitialized(): Promise<void> {
  const adminGlobal = globalThis as AdminGlobal;
  if (adminGlobal.__royalPriesthoodTursoInitialized) return;

  const client = getClient();

  await client.executeMultiple(`
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
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await seedInitialPeople(client);
  await seedDefaultAdminUser(client);
  adminGlobal.__royalPriesthoodTursoInitialized = true;
}

async function seedInitialPeople(client: ReturnType<typeof createClient>): Promise<void> {
  for (const item of INITIAL_PEOPLE_SEED) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO people (id, name, phone_number, type, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [createId('seed_person'), item.name, item.phoneNumber, item.type, new Date().toISOString()],
    });
  }
}

async function seedDefaultAdminUser(client: ReturnType<typeof createClient>): Promise<void> {
  const defaultPassword = process.env.ADMIN_PASSWORD ?? 'Golois';
  const passwordHash = hashPassword(defaultPassword);
  await client.execute({
    sql: `INSERT OR IGNORE INTO admin_users (id, username, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [createId('admin'), 'admin', 'webmaster@cmfimaryland.com', 'Golois Mouelet', passwordHash, new Date().toISOString()],
  });
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function createId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

function mapPersonRow(row: Record<string, unknown>): Person {
  return {
    id: row.id as string,
    name: row.name as string,
    phoneNumber: row.phone_number as string,
    type: row.type as PersonType,
    createdAt: row.created_at as string,
  };
}

function mapMessageHistoryRow(row: Record<string, unknown>): MessageHistoryEntry {
  return {
    id: row.id as string,
    dateSent: row.date_sent as string,
    author: row.author as string,
    message: row.message as string,
    recipientId: row.recipient_id as string,
    recipientName: row.recipient_name as string,
    recipientPhoneNumber: row.recipient_phone_number as string,
    recipientType: row.recipient_type as PersonType,
    status: row.status as 'sent' | 'failed',
    twilioSid: (row.twilio_sid as string | null) ?? undefined,
    error: (row.error as string | null) ?? undefined,
  };
}

export async function listPeople(type?: PersonType): Promise<Person[]> {
  await ensureInitialized();
  const client = getClient();

  const result = type
    ? await client.execute({ sql: `SELECT id, name, phone_number, type, created_at FROM people WHERE type = ? ORDER BY name ASC`, args: [type] })
    : await client.execute(`SELECT id, name, phone_number, type, created_at FROM people ORDER BY name ASC`);

  return result.rows.map(mapPersonRow);
}

export async function addPerson(input: {
  name: string;
  phoneNumber: string;
  type: PersonType;
}): Promise<Person> {
  await ensureInitialized();
  const client = getClient();

  const person: Person = {
    id: createId('person'),
    name: input.name,
    phoneNumber: input.phoneNumber,
    type: input.type,
    createdAt: new Date().toISOString(),
  };

  await client.execute({
    sql: `INSERT INTO people (id, name, phone_number, type, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: [person.id, person.name, person.phoneNumber, person.type, person.createdAt],
  });

  return person;
}

export async function upsertPerson(input: {
  name: string;
  phoneNumber: string;
  type: PersonType;
}): Promise<{ person: Person; created: boolean }> {
  const existingPerson = await findPersonByPhoneNumber(input.phoneNumber);

  if (!existingPerson) {
    const createdPerson = await addPerson(input);
    return { person: createdPerson, created: true };
  }

  const client = getClient();
  await client.execute({
    sql: `UPDATE people SET name = ?, type = ? WHERE id = ?`,
    args: [input.name, input.type, existingPerson.id],
  });

  return {
    person: { ...existingPerson, name: input.name, type: input.type },
    created: false,
  };
}

export async function findPersonByPhoneNumber(phoneNumber: string): Promise<Person | undefined> {
  await ensureInitialized();
  const client = getClient();

  const result = await client.execute({
    sql: `SELECT id, name, phone_number, type, created_at FROM people WHERE phone_number = ?`,
    args: [phoneNumber],
  });

  return result.rows.length > 0 ? mapPersonRow(result.rows[0]) : undefined;
}

export async function getRecipients(mode: RecipientMode, selectedRecipientIds: string[] = []): Promise<Person[]> {
  if (mode === 'all-mentees') return listPeople('mentee');
  if (mode === 'all-mentors') return listPeople('mentor');
  if (selectedRecipientIds.length === 0) return [];

  await ensureInitialized();
  const client = getClient();

  const placeholders = selectedRecipientIds.map(() => '?').join(', ');
  const result = await client.execute({
    sql: `SELECT id, name, phone_number, type, created_at FROM people WHERE id IN (${placeholders}) ORDER BY name ASC`,
    args: selectedRecipientIds,
  });

  return result.rows.map(mapPersonRow);
}

export async function addMessageHistory(entries: Omit<MessageHistoryEntry, 'id'>[]): Promise<MessageHistoryEntry[]> {
  await ensureInitialized();
  const client = getClient();

  const createdEntries = entries.map((entry) => ({ ...entry, id: createId('message') }));

  for (const entry of createdEntries) {
    await client.execute({
      sql: `INSERT INTO message_history (id, date_sent, author, message, recipient_id, recipient_name, recipient_phone_number, recipient_type, status, twilio_sid, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [entry.id, entry.dateSent, entry.author, entry.message, entry.recipientId, entry.recipientName, entry.recipientPhoneNumber, entry.recipientType, entry.status, entry.twilioSid ?? null, entry.error ?? null],
    });
  }

  return createdEntries;
}

export async function listMessageHistory(): Promise<MessageHistoryEntry[]> {
  await ensureInitialized();
  const client = getClient();

  const result = await client.execute(
    `SELECT id, date_sent, author, message, recipient_id, recipient_name, recipient_phone_number, recipient_type, status, twilio_sid, error FROM message_history ORDER BY date_sent DESC`,
  );

  return result.rows.map(mapMessageHistoryRow);
}

export async function findAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
  await ensureInitialized();
  const client = getClient();

  const result = await client.execute({
    sql: `SELECT id, username, email, name, password_hash, created_at FROM admin_users WHERE username = ?`,
    args: [username],
  });

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  return {
    id: row.id as string,
    username: row.username as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: row.password_hash as string,
    createdAt: row.created_at as string,
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  await ensureInitialized();
  const client = getClient();

  const result = await client.execute(
    `SELECT id, username, email, name, password_hash, created_at FROM admin_users ORDER BY created_at ASC`,
  );

  return result.rows.map((row) => ({
    id: row.id as string,
    username: row.username as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: row.password_hash as string,
    createdAt: row.created_at as string,
  }));
}
