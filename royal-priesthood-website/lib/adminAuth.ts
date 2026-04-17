import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { findAdminUserByUsername, hashPassword, listAdminUsers } from '@/lib/adminStore';

export const ADMIN_SESSION_COOKIE = 'royal_priesthood_admin_session';

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? 'royal-priesthood-fallback-secret';
}

function createSessionValue(username: string, passwordHash: string): string {
  return createHash('sha256')
    .update(`${username}:${passwordHash}:${getSessionSecret()}`)
    .digest('hex');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  };
}

export async function validateAdminCredentials(
  username: string,
  password: string,
): Promise<{ valid: boolean; sessionToken?: string }> {
  const user = await findAdminUserByUsername(username);

  if (!user) {
    return { valid: false };
  }

  const inputHash = hashPassword(password);

  if (!safeEqual(inputHash, user.passwordHash)) {
    return { valid: false };
  }

  return { valid: true, sessionToken: createSessionValue(user.username, user.passwordHash) };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const sessionValue = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionValue) return false;

  const users = await listAdminUsers();

  for (const user of users) {
    const expected = createSessionValue(user.username, user.passwordHash);
    if (safeEqual(sessionValue, expected)) return true;
  }

  return false;
}

export function attachAdminSessionToken(response: NextResponse, sessionToken: string): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, getCookieOptions());
  return response;
}

export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
}
