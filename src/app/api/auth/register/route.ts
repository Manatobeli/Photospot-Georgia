import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { handleApiError, jsonError, getClientIp } from '@/lib/api-utils';
import { rateLimit, RATE_LIMITS } from '@/lib/moderation';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register.limit, RATE_LIMITS.register.windowMs);
    if (!rl.allowed) {
      return jsonError(`Too many attempts. Try again in ${rl.retryAfterSeconds}s.`, 429);
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email } }),
      prisma.user.findUnique({ where: { username: data.username } }),
    ]);
    if (existingEmail) return jsonError('An account with this email already exists', 409);
    if (existingUsername) return jsonError('This username is taken', 409);

    const passwordHash = await hashPassword(data.password);
    const isFirstUser = (await prisma.user.count()) === 0;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        passwordHash,
        // The very first account created on a fresh install becomes admin,
        // so there's always a way into /admin without touching the DB by hand.
        role: isFirstUser ? 'ADMIN' : 'USER',
      },
    });

    await createNotification({
      userId: user.id,
      type: 'ADMIN_MESSAGE',
      message: `Welcome to PhotoSpot Georgia, ${user.fullName}! Start by exploring the map or uploading your first location.`,
    });

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
