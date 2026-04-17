import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/adminAuth';
import { listPeople } from '@/lib/adminStore';

function escapeCsv(value: string): string {
  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');

  if (!needsQuotes) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rows = listPeople();
  const csvLines = [
    'name,phoneNumber,type',
    ...rows.map((row) => `${escapeCsv(row.name)},${escapeCsv(row.phoneNumber)},${row.type}`),
  ];

  const now = new Date();
  const dateFragment = now.toISOString().slice(0, 10);
  const filename = `people-export-${dateFragment}.csv`;

  return new NextResponse(csvLines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
