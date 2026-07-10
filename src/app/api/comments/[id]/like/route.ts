import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const comment = await prisma.comment.findUnique({ where: { id: params.id }, include: { location: true } });
    if (!comment) return jsonError('Comment not found', 404);

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: user.id, commentId: comment.id } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentLike.create({ data: { userId: user.id, commentId: comment.id } });
      await createNotification({
        userId: comment.authorId,
        actorId: user.id,
        type: 'COMMENT_LIKED',
        message: `${user.fullName} liked your comment on "${comment.location.title}"`,
        link: `/locations/${comment.location.slug}`,
      });
    }

    const count = await prisma.commentLike.count({ where: { commentId: comment.id } });
    return NextResponse.json({ liked: !existing, likesCount: count });
  } catch (error) {
    return handleApiError(error);
  }
}
