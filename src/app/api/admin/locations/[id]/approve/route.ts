import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-utils';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const location = await prisma.location.findUnique({ where: { id: params.id } });
    if (!location) return jsonError('Location not found', 404);

    const updated = await prisma.location.update({
      where: { id: location.id },
      data: {
        status: 'APPROVED',
        rejectionNote: null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    await Promise.all([
      createNotification({
        userId: location.authorId,
        actorId: admin.id,
        type: 'POST_APPROVED',
        message: `Your location "${location.title}" was approved and is now live!`,
        link: `/locations/${location.slug}`,
      }),
      prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'APPROVE_LOCATION',
          details: `Approved "${location.title}"`,
          targetType: 'Location',
          targetId: location.id,
        },
      }),
    ]);

    return NextResponse.json({ location: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
