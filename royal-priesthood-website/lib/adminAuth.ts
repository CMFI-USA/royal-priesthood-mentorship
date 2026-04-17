import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'royal_priesthood_admin_session';

function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME ?? 'admin';
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? 'Golois';
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? `${getAdminUsername()}:${getAdminPassword()}:royal-priesthood`;
}

function createSessionValue(): string {
  return createHash('sha256')
    .update(`${getAdminUsername()}:${getAdminPassword()}:${getSessionSecret()}`)
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

export function validateAdminCredentials(username: string, password: string): boolean {
  return safeEqual(username, getAdminUsername()) && safeEqual(password, getAdminPassword());
}

export function isAdminSessionValueValid(sessionValue: string | undefined): boolean {
  if (!sessionValue) {
    return false;
  }

  return safeEqual(sessionValue, createSessionValue());
}

export function isAdminAuthenticated(): boolean {
  const sessionValue = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  return isAdminSessionValueValid(sessionValue);
}

export function attachAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionValue(), getCookieOptions());
  return response;
}

export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
}
