import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { commentSchema } from '@/lib/validation';
import { handleApiError, jsonError, getClientIp } from '@/lib/api-utils';
import { containsProfanity, rateLimit, RATE_LIMITS } from '@/lib/moderation';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
      select: { id: true },
    });
    if (!location) return jsonError('Location not found', 404);

    const comments = await prisma.comment.findMany({
      where: { locationId: location.id, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true, fullName: true, avatarUrl: true } },
        _count: { select: { likes: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { username: true, fullName: true, avatarUrl: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const ip = getClientIp(req);
    const rl = rateLimit(`comment:${user.id}:${ip}`, RATE_LIMITS.comment.limit, RATE_LIMITS.comment.windowMs);
    if (!rl.allowed) return jsonError(`You're commenting too fast. Try again in ${rl.retryAfterSeconds}s.`, 429);

    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    });
    if (!location) return jsonError('Location not found', 404);

    const { body, parentId } = commentSchema.parse(await req.json());
    if (containsProfanity(body)) return jsonError('Please keep comments respectful', 400);

    let parent = null;
    if (parentId) {
      parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.locationId !== location.id) return jsonError('Invalid reply target', 400);
    }

    const comment = await prisma.comment.create({
      data: { body, authorId: user.id, locationId: location.id, parentId: parentId || null },
      include: { author: { select: { username: true, fullName: true, avatarUrl: true } } },
    });

    if (parent) {
      await createNotification({
        userId: parent.authorId,
        actorId: user.id,
        type: 'COMMENT_REPLY',
        message: `${user.fullName} replied to your comment on "${location.title}"`,
        link: `/locations/${location.slug}`,
      });
    } else {
      await createNotification({
        userId: location.authorId,
        actorId: user.id,
        type: 'COMMENT_RECEIVED',
        message: `${user.fullName} commented on your location "${location.title}"`,
        link: `/locations/${location.slug}`,
      });
    }

    return NextResponse.json({ comment: { ...comment, _count: { likes: 0 }, replies: [] } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
