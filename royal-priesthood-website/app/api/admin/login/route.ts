import { NextResponse } from 'next/server';

import { attachAdminSession, validateAdminCredentials } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let username = '';
  let password = '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    username = String(body.username ?? '');
    password = String(body.password ?? '');
  } else {
    const formData = await request.formData();
    username = String(formData.get('username') ?? '');
    password = String(formData.get('password') ?? '');
  }

  if (!validateAdminCredentials(username, password)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid username or password.' },
      { status: 401 },
    );
  }

  return attachAdminSession(NextResponse.json({ ok: true }));
}
