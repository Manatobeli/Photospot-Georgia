import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { handleApiError, jsonError, getClientIp } from '@/lib/api-utils';
import { rateLimit, RATE_LIMITS } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`login:${ip}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs);
    if (!rl.allowed) {
      return jsonError(`Too many login attempts. Try again in ${rl.retryAfterSeconds}s.`, 429);
    }

    const body = await req.json();
    const data = loginSchema.parse(body);
    const identifier = data.identifier.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: data.identifier.trim() }],
      },
    });

    if (!user) return jsonError('Incorrect email/username or password', 401);

    const validPassword = await verifyPassword(data.password, user.passwordHash);
    if (!validPassword) return jsonError('Incorrect email/username or password', 401);

    if (user.isBanned) {
      return jsonError('This account has been banned. Contact support for details.', 403);
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
