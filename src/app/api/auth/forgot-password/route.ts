import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validation';
import { handleApiError, getClientIp, jsonError } from '@/lib/api-utils';
import { rateLimit, RATE_LIMITS } from '@/lib/moderation';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(
      `forgot:${ip}`,
      RATE_LIMITS.passwordReset.limit,
      RATE_LIMITS.passwordReset.windowMs
    );
    if (!rl.allowed) return jsonError(`Too many requests. Try again in ${rl.retryAfterSeconds}s.`, 429);

    const { email } = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond success (no user enumeration), but only actually
    // generate a token when the account exists.
    let devResetLink: string | undefined;

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const resetLink = `${siteUrl}/reset-password?token=${rawToken}`;

      // No transactional email provider is configured in this local build,
      // so the reset link is logged server-side. Wire up a real provider
      // (Resend, Postmark, SES...) here for production and remove the
      // devResetLink from the response.
      console.log(`[PhotoSpot] Password reset link for ${user.email}: ${resetLink}`);
      if (process.env.NODE_ENV !== 'production') {
        devResetLink = resetLink;
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
      devResetLink,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
