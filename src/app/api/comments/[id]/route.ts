import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const comment = await prisma.comment.findUnique({ where: { id: params.id } });
    if (!comment) return jsonError('Comment not found', 404);

    const isOwner = comment.authorId === user.id;
    const isAdmin = user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return jsonError('You can only delete your own comments', 403);

    await prisma.comment.delete({ where: { id: comment.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
