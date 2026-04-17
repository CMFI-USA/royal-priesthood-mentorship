import { NextResponse } from 'next/server';

import { getCurrentAdminUser, isAdminAuthenticated } from '@/lib/adminAuth';
import { listMessageHistory, listPeople, upsertPerson } from '@/lib/adminStore';
import { PersonType } from '@/lib/adminTypes';
import { getTwilioConfigStatus } from '@/lib/twilioMessaging';

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

function normalizePhoneNumber(rawValue: string): string | null {
  const trimmed = rawValue.trim();

  if (E164_PHONE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return null;
}

function parseCsvRow(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'CSV file is required.' }, { status: 400 });
  }

  const csvText = await file.text();
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return NextResponse.json({ ok: false, error: 'CSV file is empty.' }, { status: 400 });
  }

  const firstRow = parseCsvRow(lines[0]);
  const normalizedHeaders = firstRow.map(normalizeHeader);
  const hasHeaderRow =
    normalizedHeaders.includes('name') &&
    (normalizedHeaders.includes('phonenumber') || normalizedHeaders.includes('phone')) &&
    normalizedHeaders.includes('type');

  const startIndex = hasHeaderRow ? 1 : 0;

  let createdCount = 0;
  let updatedCount = 0;
  let invalidCount = 0;

  for (let index = startIndex; index < lines.length; index += 1) {
    const cells = parseCsvRow(lines[index]);

    if (cells.length < 3) {
      invalidCount += 1;
      continue;
    }

    const name = cells[0].trim();
    const normalizedPhoneNumber = normalizePhoneNumber(cells[1]);
    const typeValue = cells[2].trim().toLowerCase();

    if (!name || !normalizedPhoneNumber) {
      invalidCount += 1;
      continue;
    }

    if (typeValue !== 'mentor' && typeValue !== 'mentee') {
      invalidCount += 1;
      continue;
    }

    const { created } = await upsertPerson({
      name,
      phoneNumber: normalizedPhoneNumber,
      type: typeValue as PersonType,
    });

    if (created) {
      createdCount += 1;
    } else {
      updatedCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      createdCount,
      updatedCount,
      invalidCount,
      processedRows: Math.max(lines.length - startIndex, 0),
    },
    data: {
      people: await listPeople(),
      messageHistory: await listMessageHistory(),
      twilio: getTwilioConfigStatus(),
      currentUserName: (await getCurrentAdminUser())?.name ?? 'Admin',
    },
  });
}
