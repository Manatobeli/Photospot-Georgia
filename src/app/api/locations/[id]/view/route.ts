import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleApiError, jsonError, getClientIp } from '@/lib/api-utils';
import { rateLimit } from '@/lib/moderation';

// Increments the view counter, throttled per-IP-per-location so refresh
// spamming can't inflate numbers meaningfully.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
      select: { id: true, status: true },
    });
    if (!location) return jsonError('Location not found', 404);

    const ip = getClientIp(req);
    const rl = rateLimit(`view:${ip}:${location.id}`, 1, 5 * 60 * 1000); // once per 5 min
    if (rl.allowed) {
      await prisma.location.update({ where: { id: location.id }, data: { views: { increment: 1 } } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
