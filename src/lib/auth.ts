import 'server-only';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';
import type { SessionUser } from '@/types';

const SESSION_COOKIE = SESSION_COOKIE_NAME;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — "stay logged in"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

interface SessionTokenPayload {
  sub: string; // user id
}

export function signSessionToken(userId: string): string {
  const payload: SessionTokenPayload = { sub: userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionTokenPayload;
    return decoded.sub;
  } catch {
    return null;
  }
}

/** Set the session cookie on the response (Server Action / Route Handler context). */
export async function setSessionCookie(userId: string) {
  const token = signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  isBanned: true,
} as const;

/** Read the current session user from cookies (Server Components, Route Handlers). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });
  if (!user) return null;
  return user as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Not authenticated', 401);
  }
  if (user.isBanned) {
    throw new AuthError('This account has been banned', 403);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new AuthError('Admin access required', 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
