import { MessageHistoryEntry, Person, PersonType, RecipientMode } from '@/lib/adminTypes';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

type AdminGlobal = typeof globalThis & {
  __royalPriesthoodAdminDatabase?: Database.Database;
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

function getDatabasePath(): string {
  const configuredPath = process.env.SQLITE_DB_PATH;

  if (configuredPath && configuredPath.trim().length > 0) {
    if (path.isAbsolute(configuredPath)) {
      return configuredPath;
    }

    return path.resolve(process.cwd(), configuredPath);
  }

  return path.resolve(process.cwd(), 'data', 'admin.sqlite');
}

function initializeDatabase(database: Database.Database): void {
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');

  database.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('mentor', 'mentee')),
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
      recipient_type TEXT NOT NULL CHECK(recipient_type IN ('mentor', 'mentee')),
      status TEXT NOT NULL CHECK(status IN ('sent', 'failed')),
      twilio_sid TEXT,
      error TEXT,
      FOREIGN KEY(recipient_id) REFERENCES people(id) ON DELETE CASCADE
    );
  `);

  seedInitialPeople(database);
}

function seedInitialPeople(database: Database.Database): void {
  const insertStatement = database.prepare(
    `
      INSERT OR IGNORE INTO people (id, name, phone_number, type, created_at)
      VALUES (@id, @name, @phone_number, @type, @created_at)
    `,
  );

  const insertTransaction = database.transaction(
    (
      seedItems: Array<{
        name: string;
        phoneNumber: string;
        type: PersonType;
      }>,
    ) => {
      for (const item of seedItems) {
        insertStatement.run({
          id: createId('seed_person'),
          name: item.name,
          phone_number: item.phoneNumber,
          type: item.type,
          created_at: new Date().toISOString(),
        });
      }
    },
  );

  insertTransaction(INITIAL_PEOPLE_SEED);
}

function getDatabase(): Database.Database {
  const adminGlobal = globalThis as AdminGlobal;

  if (!adminGlobal.__royalPriesthoodAdminDatabase) {
    const databasePath = getDatabasePath();
    const directoryPath = path.dirname(databasePath);

    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }

    adminGlobal.__royalPriesthoodAdminDatabase = new Database(databasePath);
    initializeDatabase(adminGlobal.__royalPriesthoodAdminDatabase);
  }

  return adminGlobal.__royalPriesthoodAdminDatabase;
}

function mapPersonRow(row: {
  id: string;
  name: string;
  phone_number: string;
  type: PersonType;
  created_at: string;
}): Person {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number,
    type: row.type,
    createdAt: row.created_at,
  };
}

function mapMessageHistoryRow(row: {
  id: string;
  date_sent: string;
  author: string;
  message: string;
  recipient_id: string;
  recipient_name: string;
  recipient_phone_number: string;
  recipient_type: PersonType;
  status: 'sent' | 'failed';
  twilio_sid: string | null;
  error: string | null;
}): MessageHistoryEntry {
  return {
    id: row.id,
    dateSent: row.date_sent,
    author: row.author,
    message: row.message,
    recipientId: row.recipient_id,
    recipientName: row.recipient_name,
    recipientPhoneNumber: row.recipient_phone_number,
    recipientType: row.recipient_type,
    status: row.status,
    twilioSid: row.twilio_sid ?? undefined,
    error: row.error ?? undefined,
  }
}

function createId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${randomPart}`;
}

export function listPeople(type?: PersonType): Person[] {
  const database = getDatabase();
  const rows = type
    ? database
        .prepare(
          `
            SELECT id, name, phone_number, type, created_at
            FROM people
            WHERE type = ?
            ORDER BY name COLLATE NOCASE ASC
          `,
        )
        .all(type)
    : database
        .prepare(
          `
            SELECT id, name, phone_number, type, created_at
            FROM people
            ORDER BY name COLLATE NOCASE ASC
          `,
        )
        .all();

  return rows.map((row) => mapPersonRow(row as {
    id: string;
    name: string;
    phone_number: string;
    type: PersonType;
    created_at: string;
  }));
}

export function addPerson(input: {
  name: string;
  phoneNumber: string;
  type: PersonType;
}): Person {
  const database = getDatabase();
  const person: Person = {
    id: createId('person'),
    name: input.name,
    phoneNumber: input.phoneNumber,
    type: input.type,
    createdAt: new Date().toISOString(),
  };

  database
    .prepare(
      `
        INSERT INTO people (id, name, phone_number, type, created_at)
        VALUES (@id, @name, @phone_number, @type, @created_at)
      `,
    )
    .run({
      id: person.id,
      name: person.name,
      phone_number: person.phoneNumber,
      type: person.type,
      created_at: person.createdAt,
    });

  return person;
}

export function upsertPerson(input: {
  name: string;
  phoneNumber: string;
  type: PersonType;
}): { person: Person; created: boolean } {
  const database = getDatabase();
  const existingPerson = findPersonByPhoneNumber(input.phoneNumber);

  if (!existingPerson) {
    const createdPerson = addPerson(input);
    return { person: createdPerson, created: true };
  }

  database
    .prepare(
      `
        UPDATE people
        SET name = @name, type = @type
        WHERE id = @id
      `,
    )
    .run({
      id: existingPerson.id,
      name: input.name,
      type: input.type,
    });

  return {
    person: {
      ...existingPerson,
      name: input.name,
      type: input.type,
    },
    created: false,
  };
}

export function findPersonByPhoneNumber(phoneNumber: string): Person | undefined {
  const database = getDatabase();
  const row = database
    .prepare(
      `
        SELECT id, name, phone_number, type, created_at
        FROM people
        WHERE phone_number = ?
      `,
    )
    .get(phoneNumber) as
    | {
        id: string;
        name: string;
        phone_number: string;
        type: PersonType;
        created_at: string;
      }
    | undefined;

  return row ? mapPersonRow(row) : undefined;
}

export function getRecipients(mode: RecipientMode, selectedRecipientIds: string[] = []): Person[] {
  if (mode === 'all-mentees') {
    return listPeople('mentee');
  }

  if (mode === 'all-mentors') {
    return listPeople('mentor');
  }

  if (selectedRecipientIds.length === 0) {
    return [];
  }

  const database = getDatabase();
  const placeholders = selectedRecipientIds.map(() => '?').join(', ');
  const rows = database
    .prepare(
      `
        SELECT id, name, phone_number, type, created_at
        FROM people
        WHERE id IN (${placeholders})
        ORDER BY name COLLATE NOCASE ASC
      `,
    )
    .all(...selectedRecipientIds) as {
    id: string;
    name: string;
    phone_number: string;
    type: PersonType;
    created_at: string;
  }[];

  return rows.map(mapPersonRow);
}

export function addMessageHistory(entries: Omit<MessageHistoryEntry, 'id'>[]): MessageHistoryEntry[] {
  const database = getDatabase();
  const insertStatement = database.prepare(
    `
      INSERT INTO message_history (
        id,
        date_sent,
        author,
        message,
        recipient_id,
        recipient_name,
        recipient_phone_number,
        recipient_type,
        status,
        twilio_sid,
        error
      )
      VALUES (
        @id,
        @date_sent,
        @author,
        @message,
        @recipient_id,
        @recipient_name,
        @recipient_phone_number,
        @recipient_type,
        @status,
        @twilio_sid,
        @error
      )
    `,
  );

  const insertTransaction = database.transaction((items: MessageHistoryEntry[]) => {
    for (const entry of items) {
      insertStatement.run({
        id: entry.id,
        date_sent: entry.dateSent,
        author: entry.author,
        message: entry.message,
        recipient_id: entry.recipientId,
        recipient_name: entry.recipientName,
        recipient_phone_number: entry.recipientPhoneNumber,
        recipient_type: entry.recipientType,
        status: entry.status,
        twilio_sid: entry.twilioSid ?? null,
        error: entry.error ?? null,
      });
    }
  });

  const createdEntries = entries.map((entry) => ({
    ...entry,
    id: createId('message'),
  }));

  insertTransaction(createdEntries);
  return createdEntries;
}

export function listMessageHistory(): MessageHistoryEntry[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT
          id,
          date_sent,
          author,
          message,
          recipient_id,
          recipient_name,
          recipient_phone_number,
          recipient_type,
          status,
          twilio_sid,
          error
        FROM message_history
        ORDER BY date_sent DESC
      `,
    )
    .all() as {
    id: string;
    date_sent: string;
    author: string;
    message: string;
    recipient_id: string;
    recipient_name: string;
    recipient_phone_number: string;
    recipient_type: PersonType;
    status: 'sent' | 'failed';
    twilio_sid: string | null;
    error: string | null;
  }[];

  return rows.map(mapMessageHistoryRow);
}
