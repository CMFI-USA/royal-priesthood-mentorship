import { NextResponse } from 'next/server';

import { attachAdminSessionToken, validateAdminCredentials } from '@/lib/adminAuth';

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

  const result = await validateAdminCredentials(username, password);

  if (!result.valid || !result.sessionToken) {
    return NextResponse.json(
      { ok: false, error: 'Invalid username or password.' },
      { status: 401 },
    );
  }

  return attachAdminSessionToken(NextResponse.json({ ok: true }), result.sessionToken);
}
