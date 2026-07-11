import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { handleApiError, getClientIp, jsonError } from '@/lib/api-utils';
import { rateLimit, RATE_LIMITS } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = resetPasswordSchema.parse(await req.json());

    // Rate-limit by both IP and email — a 6-digit code only has 1,000,000
    // possibilities, so unlimited attempts would make it guessable.
    const ip = getClientIp(req);
    const rl = rateLimit(
      `reset-verify:${ip}:${email}`,
      RATE_LIMITS.passwordResetVerify.limit,
      RATE_LIMITS.passwordResetVerify.windowMs
    );
    if (!rl.allowed) {
      return jsonError(`Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`, 429);
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        resetTokenHash: codeHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return jsonError('That code is invalid or has expired. Request a new one.', 400);
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiry: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}