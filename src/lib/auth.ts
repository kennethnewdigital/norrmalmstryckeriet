import { SignJWT, jwtVerify } from 'jose';
import type { AstroCookies } from 'astro';

const COOKIE_NAME = 'nmt_admin';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7d

function secret(): Uint8Array {
  const s = import.meta.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(s);
}

export function isAdminEmail(email: string): boolean {
  const raw = import.meta.env.ADMIN_EMAILS || '';
  const list = raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function signAdminJwt(email: string): Promise<string> {
  return await new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyAdminJwt(token: string | undefined | null): Promise<{ email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== 'admin' || typeof payload.email !== 'string') return null;
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

export function setAdminCookie(cookies: AstroCookies, token: string) {
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAdminCookie(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function getAdminFromRequest(cookies: AstroCookies): Promise<{ email: string } | null> {
  const token = cookies.get(COOKIE_NAME)?.value;
  return await verifyAdminJwt(token);
}

export function makeCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
