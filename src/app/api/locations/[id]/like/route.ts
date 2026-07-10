import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const location = await prisma.location.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
    });
    if (!location) return jsonError('Location not found', 404);

    const existing = await prisma.like.findUnique({
      where: { userId_locationId: { userId: user.id, locationId: location.id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
    } else {
      await prisma.like.create({ data: { userId: user.id, locationId: location.id } });
      await createNotification({
        userId: location.authorId,
        actorId: user.id,
        type: 'LOCATION_LIKED',
        message: `${user.fullName} liked your location "${location.title}"`,
        link: `/locations/${location.slug}`,
      });
    }

    const count = await prisma.like.count({ where: { locationId: location.id } });
    return NextResponse.json({ liked: !existing, likesCount: count });
  } catch (error) {
    return handleApiError(error);
  }
}
